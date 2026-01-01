<?php

namespace App\Http\Controllers;

use App\Models\Credential;
use App\Models\CredentialShareLink;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Inertia;

class CredentialShareController extends Controller
{
    /**
     * Create a new share link for a credential.
     */
    public function store(Request $request, Credential $credential)
    {
        Gate::authorize('share', $credential);

        $validated = $request->validate([
            'expires_in' => 'required|in:1h,6h,24h,48h,7d',
            'max_views' => 'required|integer|min:1|max:100',
            'access_password' => 'nullable|string|min:4|max:50',
            'recipient_email' => 'nullable|email',
            'note' => 'nullable|string|max:500',
            'show_username' => 'boolean',
            'show_password' => 'boolean',
            'show_url' => 'boolean',
        ]);

        // Calculate expiry
        $expiresAt = match ($validated['expires_in']) {
            '1h' => now()->addHour(),
            '6h' => now()->addHours(6),
            '24h' => now()->addHours(24),
            '48h' => now()->addHours(48),
            '7d' => now()->addDays(7),
            default => now()->addHours(24),
        };

        $shareLink = CredentialShareLink::createForCredential(
            $credential->id,
            $request->user()->id,
            [
                'expires_at' => $expiresAt,
                'max_views' => $validated['max_views'],
                'password' => $validated['access_password'] ?? null,
                'recipient_email' => $validated['recipient_email'] ?? null,
                'note' => $validated['note'] ?? null,
                'show_username' => $validated['show_username'] ?? true,
                'show_password' => $validated['show_password'] ?? true,
                'show_url' => $validated['show_url'] ?? true,
            ]
        );

        // Log the share action
        activity()
            ->performedOn($credential)
            ->causedBy($request->user())
            ->withProperties([
                'share_link_id' => $shareLink->id,
                'expires_at' => $expiresAt->toIso8601String(),
                'max_views' => $validated['max_views'],
                'has_password' => !empty($validated['access_password']),
                'recipient_email' => $validated['recipient_email'] ?? null,
            ])
            ->log('credential_share_link_created');

        return response()->json([
            'success' => true,
            'share_url' => $shareLink->getShareUrl(),
            'expires_at' => $expiresAt->toIso8601String(),
            'expires_in_human' => $shareLink->getTimeRemaining(),
        ]);
    }

    /**
     * View a shared credential (public route).
     */
    public function show(Request $request, string $token)
    {
        // Rate limit by IP to prevent brute force
        $key = 'share-view:' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 10)) {
            return Inertia::render('Share/RateLimited', [
                'retryAfter' => RateLimiter::availableIn($key),
            ]);
        }
        RateLimiter::hit($key, 60);

        $shareLink = CredentialShareLink::where('token', $token)
            ->with(['credential.project:id,name'])
            ->first();

        if (!$shareLink) {
            return Inertia::render('Share/NotFound');
        }

        if ($shareLink->isExpired()) {
            return Inertia::render('Share/Expired', [
                'expiredAt' => $shareLink->expires_at->format('M j, Y g:i A'),
            ]);
        }

        if ($shareLink->hasReachedViewLimit()) {
            return Inertia::render('Share/ViewLimitReached', [
                'maxViews' => $shareLink->max_views,
            ]);
        }

        // Check if password is required
        $needsPassword = !empty($shareLink->access_password);
        $passwordVerified = $request->session()->get("share_verified_{$token}", false);

        if ($needsPassword && !$passwordVerified) {
            return Inertia::render('Share/PasswordRequired', [
                'token' => $token,
                'credentialTitle' => $shareLink->credential->title,
                'projectName' => $shareLink->credential->project?->name,
                'note' => $shareLink->note,
            ]);
        }

        // Record the access
        $shareLink->recordAccess(
            $request->ip(),
            $request->userAgent()
        );

        // Build the credential data based on visibility settings
        $credentialData = [
            'title' => $shareLink->credential->title,
            'type' => $shareLink->credential->type,
            'project_name' => $shareLink->credential->project?->name,
        ];

        if ($shareLink->show_username) {
            $credentialData['username'] = $shareLink->credential->username;
        }
        if ($shareLink->show_password) {
            $credentialData['password'] = $shareLink->credential->password;
        }
        if ($shareLink->show_url) {
            $credentialData['url'] = $shareLink->credential->url;
        }

        return Inertia::render('Share/ViewCredential', [
            'credential' => $credentialData,
            'note' => $shareLink->note,
            'expiresAt' => $shareLink->expires_at->format('M j, Y g:i A'),
            'viewsRemaining' => $shareLink->max_views - $shareLink->view_count,
            'sharedBy' => $shareLink->creator->name ?? 'Unknown',
        ]);
    }

    /**
     * Verify password for protected share link.
     */
    public function verifyPassword(Request $request, string $token)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        // Rate limit password attempts
        $key = 'share-password:' . $request->ip() . ':' . $token;
        if (RateLimiter::tooManyAttempts($key, 5)) {
            return back()->withErrors([
                'password' => 'Too many attempts. Please try again in ' . RateLimiter::availableIn($key) . ' seconds.',
            ]);
        }

        $shareLink = CredentialShareLink::where('token', $token)->first();

        if (!$shareLink || !$shareLink->isValid()) {
            return redirect()->route('share.show', $token);
        }

        if (!Hash::check($request->password, $shareLink->access_password)) {
            RateLimiter::hit($key, 300); // 5 minute lockout after 5 failed attempts
            
            $shareLink->recordAccess(
                $request->ip(),
                $request->userAgent(),
                false // password incorrect
            );

            return back()->withErrors([
                'password' => 'Incorrect password.',
            ]);
        }

        // Store verification in session
        $request->session()->put("share_verified_{$token}", true);

        return redirect()->route('share.show', $token);
    }

    /**
     * List all share links for a credential (for management).
     */
    public function index(Request $request, Credential $credential)
    {
        Gate::authorize('view', $credential);

        $shareLinks = $credential->shareLinks()
            ->with('creator:id,name')
            ->withCount('accessLogs')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($link) => [
                'id' => $link->id,
                'share_url' => $link->getShareUrl(),
                'expires_at' => $link->expires_at->format('M j, Y g:i A'),
                'is_expired' => $link->isExpired(),
                'max_views' => $link->max_views,
                'view_count' => $link->view_count,
                'has_password' => !empty($link->access_password),
                'recipient_email' => $link->recipient_email,
                'created_by' => $link->creator->name ?? 'Unknown',
                'created_at' => $link->created_at->format('M j, Y g:i A'),
                'access_logs_count' => $link->access_logs_count,
            ]);

        return response()->json(['share_links' => $shareLinks]);
    }

    /**
     * Revoke (delete) a share link.
     */
    public function destroy(Request $request, CredentialShareLink $shareLink)
    {
        Gate::authorize('delete', $shareLink->credential);

        activity()
            ->performedOn($shareLink->credential)
            ->causedBy($request->user())
            ->withProperties([
                'share_link_id' => $shareLink->id,
                'was_active' => $shareLink->isValid(),
            ])
            ->log('credential_share_link_revoked');

        $shareLink->delete();

        return response()->json(['success' => true]);
    }
}
