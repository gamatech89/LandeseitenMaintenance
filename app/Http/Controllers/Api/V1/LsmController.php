<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\LsmService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

/**
 * Landeseiten Maintenance Controller
 * 
 * Handles communication with WordPress sites via the LSM plugin.
 */
class LsmController extends Controller
{
    /**
     * Get LSM status and capabilities for a project.
     */
    public function status(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json([
                'configured' => false,
                'message' => 'LSM plugin not configured for this project. Set the API key in project settings.',
            ]);
        }

        $connection = $lsm->testConnection();

        return response()->json([
            'configured' => true,
            'connected' => $connection['connected'],
            'plugin_version' => $connection['version'] ?? null,
            'message' => $connection['connected'] 
                ? 'LSM plugin is connected and ready'
                : 'Cannot connect to LSM plugin: ' . ($connection['error'] ?? 'Unknown error'),
        ]);
    }

    /**
     * Get full health data from WordPress site.
     */
    public function health(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $health = $lsm->getHealth();

        if (!$health) {
            return response()->json(['error' => 'Failed to fetch health data'], 500);
        }

        return response()->json($health);
    }

    /**
     * Generate SSO login token and return login URL.
     */
    public function generateLoginToken(Project $project, Request $request): JsonResponse
    {
        Gate::authorize('update', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->generateLoginToken(
            role: $request->input('role', 'administrator')
        );

        if (!$result || !isset($result['login_url'])) {
            return response()->json([
                'error' => 'Failed to generate login token',
                'details' => $result
            ], 500);
        }

        return response()->json([
            'success' => true,
            'login_url' => $result['login_url'],
            'expires_in' => $result['expires'] ?? 300,
        ]);
    }

    /**
     * Clear all caches on the WordPress site.
     */
    public function clearCache(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->clearCache();

        if (!$result) {
            return response()->json(['error' => 'Failed to clear cache'], 500);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
            'message' => 'Cache cleared successfully',
        ]);
    }

    /**
     * Get available updates (core, plugins, themes).
     */
    public function getUpdates(Project $project): JsonResponse
    {
        Gate::authorize('view', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $updates = $lsm->getAvailableUpdates();

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

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->updatePlugins();

        if (!$result) {
            return response()->json(['error' => 'Failed to update plugins'], 500);
        }

        return response()->json($result);
    }

    /**
     * Update WordPress core.
     */
    public function updateCore(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->updateCore();

        return response()->json($result ?? ['error' => 'Failed to update core']);
    }

    /**
     * Optimize database.
     */
    public function optimizeDatabase(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->optimizeDatabase();

        return response()->json($result ?? ['error' => 'Failed to optimize database']);
    }

    /**
     * Flush rewrite rules.
     */
    public function flushRewrite(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->flushRewriteRules();

        return response()->json([
            'success' => true,
            'message' => 'Rewrite rules flushed',
            'data' => $result
        ]);
    }

    /**
     * Get recovery status.
     */
    public function recoveryStatus(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->getRecoveryStatus();

        return response()->json($result ?? ['error' => 'Failed to get recovery status']);
    }

    /**
     * Enable maintenance mode.
     */
    public function enableMaintenance(Project $project, Request $request): JsonResponse
    {
        Gate::authorize('update', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->enableMaintenance();

        return response()->json($result ?? ['error' => 'Failed to enable maintenance mode']);
    }

    /**
     * Disable maintenance mode.
     */
    public function disableMaintenance(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->disableMaintenance();

        return response()->json($result ?? ['error' => 'Failed to disable maintenance mode']);
    }

    /**
     * Disable all plugins (emergency).
     */
    public function disablePlugins(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->disableAllPlugins();

        return response()->json($result ?? ['error' => 'Failed to disable plugins']);
    }

    /**
     * Restore disabled plugins.
     */
    public function restorePlugins(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->restorePlugins();

        return response()->json($result ?? ['error' => 'Failed to restore plugins']);
    }

    /**
     * Execute full emergency recovery.
     */
    public function emergencyRecovery(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        $lsm = LsmService::for($project);

        if (!$lsm->isConfigured()) {
            return response()->json(['error' => 'LSM not configured'], 400);
        }

        $result = $lsm->emergencyRecovery();

        return response()->json($result ?? ['error' => 'Failed to execute emergency recovery']);
    }
    /**
     * Download the LSM plugin as a zip file.
     * 
     * @param Request $request
     * @param Project $project
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse
     */
    public function downloadPlugin(Request $request, Project $project)
    {
        // Path to the plugin directory
        $pluginPath = base_path('wordpress-plugin/landeseiten-maintenance');
        $zipFileName = 'landeseiten-maintenance.zip';
        $zipPath = storage_path('app/temp/' . $zipFileName);
        
        // Ensure temp directory exists
        if (!file_exists(dirname($zipPath))) {
            mkdir(dirname($zipPath), 0755, true);
        }

        // Initialize ZipArchive
        $zip = new \ZipArchive();
        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === TRUE) {
            
            // Create recursive directory iterator
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($pluginPath),
                \RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $name => $file) {
                // Skip directories (they would be added automatically)
                if (!$file->isDir()) {
                    // Get real and relative path for current file
                    $filePath = $file->getRealPath();
                    $relativePath = 'landeseiten-maintenance/' . substr($filePath, strlen($pluginPath) + 1);

                    // Skip git files or DS_Store
                    if (strpos($filePath, '.git') !== false || strpos($filePath, '.DS_Store') !== false) {
                        continue;
                    }

                    // Add current file to archive
                    $zip->addFile($filePath, $relativePath);
                }
            }

            // Close and save archive
            $zip->close();
        }

        // Return the file as download
        return response()->download($zipPath, $zipFileName)->deleteFileAfterSend(true);
    }
}
