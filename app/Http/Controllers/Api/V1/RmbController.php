<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\RmbService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Remote Management Bridge Controller
 * 
 * Handles communication with WordPress sites via the RMB plugin.
 */
class RmbController extends Controller
{
    /**
     * Get RMB status and capabilities for a project.
     */
    public function status(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json([
                'configured' => false,
                'message' => 'RMB plugin not configured for this project. Set the API key in project settings.',
            ]);
        }

        $connection = $rmb->testConnection();

        return response()->json([
            'configured' => true,
            'connected' => $connection['connected'],
            'plugin_version' => $connection['version'] ?? null,
            'message' => $connection['connected'] 
                ? 'RMB plugin is connected and ready'
                : 'Cannot connect to RMB plugin: ' . ($connection['error'] ?? 'Unknown error'),
        ]);
    }

    /**
     * Get full health data from WordPress site.
     */
    public function health(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $health = $rmb->getHealth();

        if (!$health) {
            return response()->json(['error' => 'Failed to fetch health data'], 500);
        }

        // Also update project in database
        $rmb->refreshHealth();

        return response()->json($health);
    }

    /**
     * Generate SSO login token and return login URL.
     */
    public function generateLoginToken(Project $project, Request $request): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->generateLoginToken(
            ttl: $request->input('ttl', 300),
            bindIp: $request->input('bind_ip', true),
            ipAddress: $request->ip()
        );

        if (!$result || !isset($result['token'])) {
            return response()->json([
                'error' => 'Failed to generate login token',
                'details' => $result
            ], 500);
        }

        return response()->json([
            'success' => true,
            'token' => $result['token'],
            'login_url' => $rmb->buildLoginUrl($result['token']),
            'expires_in' => $result['expires_in'] ?? 300,
        ]);
    }

    /**
     * Clear all caches on the WordPress site.
     */
    public function clearCache(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->clearCache();

        if (!$result) {
            return response()->json(['error' => 'Failed to clear cache'], 500);
        }

        return response()->json([
            'success' => true,
            'cleared' => $result['cleared'] ?? [],
            'message' => $result['message'] ?? 'Cache cleared successfully',
        ]);
    }

    /**
     * Get available updates (core, plugins, themes).
     */
    public function getUpdates(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $updates = $rmb->getAvailableUpdates();

        if (!$updates) {
            return response()->json(['error' => 'Failed to fetch updates'], 500);
        }

        return response()->json($updates);
    }

    /**
     * Update all plugins.
     */
    public function updateAllPlugins(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->updateAllPlugins();

        if (!$result) {
            return response()->json(['error' => 'Failed to update plugins'], 500);
        }

        return response()->json($result);
    }

    /**
     * Update a specific plugin.
     */
    public function updatePlugin(Project $project, Request $request): JsonResponse
    {
        Gate::authorize('update', $project);

        $request->validate(['slug' => 'required|string']);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->updatePlugin($request->input('slug'));

        return response()->json($result ?? ['error' => 'Failed to update plugin']);
    }

    /**
     * Update WordPress core.
     */
    public function updateCore(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->updateCore();

        return response()->json($result ?? ['error' => 'Failed to update core']);
    }

    /**
     * Optimize database.
     */
    public function optimizeDatabase(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->optimizeDatabase();

        return response()->json($result ?? ['error' => 'Failed to optimize database']);
    }

    /**
     * Flush rewrite rules.
     */
    public function flushRewrite(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->flushRewriteRules();

        return response()->json([
            'success' => true,
            'message' => 'Rewrite rules flushed',
        ]);
    }

    /**
     * Get recovery status.
     */
    public function recoveryStatus(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->getRecoveryStatus();

        return response()->json($result ?? ['error' => 'Failed to get recovery status']);
    }

    /**
     * Enable maintenance mode.
     */
    public function enableMaintenance(Project $project, Request $request): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->enableMaintenance($request->input('message'));

        return response()->json($result ?? ['error' => 'Failed to enable maintenance mode']);
    }

    /**
     * Disable maintenance mode.
     */
    public function disableMaintenance(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->disableMaintenance();

        return response()->json($result ?? ['error' => 'Failed to disable maintenance mode']);
    }

    /**
     * Disable all plugins (emergency).
     */
    public function disablePlugins(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->disableAllPlugins();

        return response()->json($result ?? ['error' => 'Failed to disable plugins']);
    }

    /**
     * Restore disabled plugins.
     */
    public function restorePlugins(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->restorePlugins();

        return response()->json($result ?? ['error' => 'Failed to restore plugins']);
    }

    /**
     * Execute full emergency recovery.
     */
    public function emergencyRecovery(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->emergencyRecovery();

        return response()->json($result ?? ['error' => 'Failed to execute emergency recovery']);
    }

    /**
     * Switch to default theme.
     */
    public function switchTheme(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $rmb = RmbService::for($project);

        if (!$rmb->isConfigured()) {
            return response()->json(['error' => 'RMB not configured'], 400);
        }

        $result = $rmb->switchToDefaultTheme();

        return response()->json($result ?? ['error' => 'Failed to switch theme']);
    }
}
