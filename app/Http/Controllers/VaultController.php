<?php

namespace App\Http\Controllers;

use App\Models\Credential;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class VaultController extends Controller
{
    /**
     * Display a listing of credentials based on user permissions.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Credential::with('project:id,name,url');

        // Filter credentials based on user role
        if (!$user->isAdmin()) {
            // Get project IDs the user has access to
            $accessibleProjectIds = $this->getAccessibleProjectIds($user);
            $query->whereIn('project_id', $accessibleProjectIds);
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('url', 'like', "%{$search}%")
                  ->orWhereHas('project', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Type filter
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Project filter
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        $credentials = $query->orderBy('created_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Hide passwords in the response - they must be fetched individually
        $credentials->getCollection()->transform(function ($credential) {
            $credential->password = $credential->password ? '••••••••' : null;
            return $credential;
        });

        // Get accessible projects for filter dropdown (based on user role)
        $projects = $this->getAccessibleProjects($user);

        return Inertia::render('Vault/Index', [
            'credentials' => $credentials,
            'projects' => $projects,
            'filters' => $request->only(['search', 'type', 'project_id']),
        ]);
    }

    /**
     * Reveal a credential's password and log the access.
     */
    public function revealPassword(Request $request, Credential $credential)
    {
        $user = $request->user();
        
        // Check if user has access to this credential's project
        if (!$user->isAdmin()) {
            $accessibleProjectIds = $this->getAccessibleProjectIds($user);
            if (!in_array($credential->project_id, $accessibleProjectIds)) {
                abort(403, 'You do not have access to this credential.');
            }
        }

        // Log the password reveal event
        activity()
            ->performedOn($credential)
            ->causedBy($user)
            ->withProperties([
                'credential_title' => $credential->title,
                'project_id' => $credential->project_id,
                'project_name' => $credential->project?->name,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ])
            ->log('password_revealed');

        return response()->json([
            'password' => $credential->password,
        ]);
    }

    /**
     * Delete a credential (admin only).
     */
    public function destroy(Request $request, Credential $credential)
    {
        $user = $request->user();
        
        // Only admins can delete credentials from vault
        if (!$user->isAdmin()) {
            abort(403, 'Only administrators can delete credentials from the vault.');
        }

        // Also delete any share links associated with this credential
        $credential->shareLinks()->delete();
        
        $credential->delete();

        return back()->with('success', 'Credential deleted successfully!');
    }

    /**
     * Get project IDs that the user has access to.
     */
    private function getAccessibleProjectIds($user): array
    {
        if ($user->isAdmin()) {
            return Project::pluck('id')->toArray();
        }

        $projectIds = [];

        // Managers can access their managed projects
        if ($user->isManager()) {
            $projectIds = array_merge($projectIds, $user->managedProjects()->pluck('id')->toArray());
        }

        // Developers can access their assigned projects
        $projectIds = array_merge($projectIds, $user->developedProjects()->pluck('id')->toArray());

        return array_unique($projectIds);
    }

    /**
     * Get projects for the filter dropdown.
     */
    private function getAccessibleProjects($user)
    {
        $query = Project::select('id', 'name')->orderBy('name');

        if (!$user->isAdmin()) {
            $accessibleIds = $this->getAccessibleProjectIds($user);
            $query->whereIn('id', $accessibleIds);
        }

        return $query->get();
    }
}
