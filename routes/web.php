<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\CredentialController;
use App\Http\Controllers\CredentialShareController;
use App\Http\Controllers\TodoController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\VaultController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\NotificationController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => false, // Registration disabled - admins create users via Team Management
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Public credential share routes (no auth required)
Route::prefix('share')->name('share.')->group(function () {
    Route::get('/credential/{token}', [CredentialShareController::class, 'show'])->name('show');
    Route::post('/credential/{token}/verify', [CredentialShareController::class, 'verifyPassword'])->name('verify');
});

// =====================================================
// TEST ENDPOINTS - Mock WordPress Health API (DEV ONLY)
// Remove these in production!
// =====================================================
if (app()->environment('local')) {
    Route::prefix('wp-json/lsm/v1')->group(function () {
        // Successful health response
        Route::get('/health', function (\Illuminate\Http\Request $request) {
            $key = $request->get('key');
            
            // Simulate invalid key
            if ($key !== 'test-secret-123') {
                return response()->json(['error' => 'Invalid key'], 401);
            }
            
            // Simulate different scenarios based on query param
            $scenario = $request->get('scenario', 'healthy');
            
            if ($scenario === 'error500') {
                abort(500, 'Internal Server Error');
            }
            
            if ($scenario === 'error503') {
                abort(503, 'Service Unavailable');
            }
            
            if ($scenario === 'outdated') {
                return response()->json([
                    'status' => 'warning',
                    'wordpress' => ['version' => '5.9.0'],
                    'php' => ['version' => '7.4.33'],
                    'plugins' => [
                        'total_count' => 15,
                        'active_count' => 12,
                        'outdated_count' => 8,
                        'outdated_plugins' => [
                            ['name' => 'Contact Form 7', 'current_version' => '5.5', 'new_version' => '5.8'],
                            ['name' => 'Yoast SEO', 'current_version' => '19.0', 'new_version' => '21.5'],
                        ],
                    ],
                    'theme' => ['name' => 'Astra', 'version' => '3.9.0', 'update_available' => true],
                    'ssl' => ['enabled' => true],
                    'updates' => ['core_update_available' => true, 'core_new_version' => '6.4.2'],
                    'security' => ['debug_mode' => true, 'file_editing_disabled' => false],
                    'disk' => ['free_space' => '2.5 GB', 'total_space' => '10 GB'],
                    'performance' => ['memory_usage' => '128 MB'],
                ]);
            }
            
            // Default: healthy site
            return response()->json([
                'status' => 'ok',
                'wordpress' => ['version' => '6.4.2'],
                'php' => ['version' => '8.2.14'],
                'plugins' => [
                    'total_count' => 12,
                    'active_count' => 10,
                    'outdated_count' => 0,
                    'outdated_plugins' => [],
                ],
                'theme' => ['name' => 'Flavor starter theme flavorkids flavor kids', 'version' => '2.1.0', 'update_available' => false],
                'ssl' => ['enabled' => true],
                'updates' => ['core_update_available' => false],
                'security' => ['debug_mode' => false, 'file_editing_disabled' => true],
                'disk' => ['free_space' => '15.2 GB', 'total_space' => '20 GB'],
                'performance' => ['memory_usage' => '64 MB'],
            ]);
        });
        
        Route::get('/ping', function () {
            return response()->json([
                'status' => 'ok',
                'plugin' => 'lsm-health-monitor',
                'version' => '1.0.0',
                'licensed' => true,
            ]);
        });
    });
}
// =====================================================

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Projects
    Route::resource('projects', ProjectController::class);
    Route::post('/projects/{project}/check-health', [ProjectController::class, 'checkHealth'])->name('projects.check-health');
    
    // Credentials (nested under projects)
    Route::post('/projects/{project}/credentials', [CredentialController::class, 'store'])->name('credentials.store');
    Route::put('/projects/{project}/credentials/{credential}', [CredentialController::class, 'update'])->name('credentials.update');
    Route::delete('/projects/{project}/credentials/{credential}', [CredentialController::class, 'destroy'])->name('credentials.destroy');
    
    // Credential Share Links
    Route::post('/credentials/{credential}/share', [CredentialShareController::class, 'store'])->name('credentials.share.store');
    Route::get('/credentials/{credential}/share-links', [CredentialShareController::class, 'index'])->name('credentials.share.index');
    Route::delete('/share-links/{shareLink}', [CredentialShareController::class, 'destroy'])->name('credentials.share.destroy');
    
    // Resources (nested under projects)
    Route::post('/projects/{project}/resources', [ResourceController::class, 'store'])->name('resources.store');
    Route::put('/projects/{project}/resources/{resource}', [ResourceController::class, 'update'])->name('resources.update');
    Route::delete('/projects/{project}/resources/{resource}', [ResourceController::class, 'destroy'])->name('resources.destroy');
    Route::get('/projects/{project}/resources/{resource}/download', [ResourceController::class, 'download'])->name('resources.download');
    
    // Todos (nested under projects)
    Route::post('/projects/{project}/todos', [TodoController::class, 'store'])->name('todos.store');
    Route::put('/projects/{project}/todos/{todo}', [TodoController::class, 'update'])->name('todos.update');
    Route::delete('/projects/{project}/todos/{todo}', [TodoController::class, 'destroy'])->name('todos.destroy');
    Route::get('/projects/{project}/todos/{todo}/download', [TodoController::class, 'download'])->name('todos.download');
    
    // Vault (global credentials view)
    Route::get('/vault', [VaultController::class, 'index'])->name('vault.index');
    Route::get('/vault/credentials/{credential}/reveal', [VaultController::class, 'revealPassword'])
        ->name('vault.reveal');
    Route::delete('/vault/credentials/{credential}', [VaultController::class, 'destroy'])
        ->name('vault.destroy');
    
    // Activity Log
    Route::get('/activity', [ActivityController::class, 'index'])->name('activity.index');
    
    // Team Management (admin only for create/update/delete)
    Route::middleware(['role:admin,manager'])->group(function () {
        Route::get('/team', [TeamController::class, 'index'])->name('team.index');
        Route::get('/team/{user}/projects', [TeamController::class, 'getProjects'])->name('team.projects');
        Route::put('/team/{user}/projects', [TeamController::class, 'updateProjects'])->name('team.updateProjects');
        Route::get('/team/{user}/developer-projects', [TeamController::class, 'getDeveloperProjects'])->name('team.developerProjects');
        Route::put('/team/{user}/developer-projects', [TeamController::class, 'updateDeveloperProjects'])->name('team.updateDeveloperProjects');
    });
    Route::middleware(['role:admin'])->group(function () {
        Route::post('/team', [TeamController::class, 'store'])->name('team.store');
        Route::put('/team/{user}', [TeamController::class, 'update'])->name('team.update');
        Route::delete('/team/{user}', [TeamController::class, 'destroy'])->name('team.destroy');
    });
    
    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Global Search API (rate limited: 30 requests per minute)
    Route::get('/api/search', [SearchController::class, 'search'])
        ->middleware('throttle:search')
        ->name('api.search');
    
    // Data Export
    Route::prefix('export')->name('export.')->group(function () {
        Route::get('/projects', [ExportController::class, 'exportProjects'])->name('projects');
        Route::get('/credentials', [ExportController::class, 'exportCredentials'])->name('credentials');
        Route::get('/projects/{project}', [ExportController::class, 'exportProject'])->name('project');
    });
    
    // Tags API
    Route::get('/api/tags', [TagController::class, 'index'])->name('api.tags.index');
    Route::post('/api/tags', [TagController::class, 'store'])->name('api.tags.store');
    Route::put('/api/tags/{tag}', [TagController::class, 'update'])->name('api.tags.update');
    Route::delete('/api/tags/{tag}', [TagController::class, 'destroy'])->name('api.tags.destroy');
    
    // Notifications API
    Route::get('/api/notifications', [NotificationController::class, 'index'])->name('api.notifications.index');
    Route::post('/api/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('api.notifications.read');
    Route::post('/api/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('api.notifications.read-all');
});

require __DIR__.'/auth.php';

// TEMPORARY: Password reset route - DELETE AFTER USE!
Route::get('/reset-admin-password/{secret}', function ($secret) {
    if ($secret !== 'lsm-reset-2026') {
        abort(404);
    }
    $user = \App\Models\User::where('email', 'admin@landeseiten.de')->first();
    if ($user) {
        $user->password = \Illuminate\Support\Facades\Hash::make('LsmAdmin2024!');
        $user->save();
        return 'Password reset to: LsmAdmin2024! - DELETE THIS ROUTE NOW!';
    }
    return 'User not found';
});
