<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Tag;
use App\Models\Todo;
use App\Models\User;
use App\Notifications\ProjectAssignedNotification;
use App\Notifications\ProjectStatusChangedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Project::class);

        $query = Project::query()->with(['manager:id,name', 'developer:id,name', 'developers:id,name', 'tags'])->withCount(['todos' => function ($q) {
            $q->where('status', '!=', 'completed');
        }])->with(['todos' => function ($q) {
            $q->where('status', '!=', 'completed')->select('project_id', 'priority');
        }]);

        // Filter by health status
        if ($request->has('health') && $request->health !== 'all') {
            $query->where('health_status', $request->health);
        }

        // Filter by security status
        if ($request->has('security') && $request->security !== 'all') {
            $query->where('security_status', $request->security);
        }

        // Filter by manager (PM)
        if ($request->filled('manager_id')) {
            $query->where('manager_id', $request->manager_id);
        }

        // Filter by developer (check both legacy developer_id and developers pivot)
        if ($request->filled('developer_id')) {
            $developerId = $request->developer_id;
            $query->where(function($q) use ($developerId) {
                $q->where('developer_id', $developerId)
                  ->orWhereHas('developers', fn($sub) => $sub->where('users.id', $developerId));
            });
        }

        // Filter by tag
        if ($request->filled('tag')) {
            $query->whereHas('tags', function ($q) use ($request) {
                $q->where('slug', $request->tag);
            });
        }

        // Search
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('url', 'like', '%' . $request->search . '%')
                  ->orWhere('client_email', 'like', '%' . $request->search . '%')
                  ->orWhere('project_external_id', 'like', '%' . $request->search . '%');
            });
        }

        $projects = $query->orderBy('updated_at', 'desc')->paginate(15);

        // Get managers (role = manager) for PM select
        $managers = User::where('role', 'manager')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get developers (role = developer) for developer select
        $developers = User::where('role', 'developer')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get all users for backwards compatibility
        $users = User::select('id', 'name', 'role')->orderBy('name')->get();

        // Get all tags for filtering
        $tags = Tag::orderBy('name')->get();

        // Calculate overall stats (not affected by filters)
        $stats = [
            'total' => Project::count(),
            'online' => Project::where('health_status', 'online')->count(),
            'secure' => Project::where('security_status', 'secure')->count(),
            'issues' => Project::where(function($q) {
                $q->whereIn('health_status', ['offline', 'down_error'])
                  ->orWhereIn('security_status', ['hacked', 'compromised']);
            })->count(),
        ];

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'filters' => $request->only(['health', 'security', 'search', 'manager_id', 'developer_id', 'tag']),
            'users' => $users,
            'managers' => $managers,
            'developers' => $developers,
            'tags' => $tags,
            'stats' => $stats,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project): Response
    {
        Gate::authorize('view', $project);

        $project->load(['credentials', 'resources', 'todos.assignee:id,name', 'manager:id,name', 'developer:id,name', 'developers:id,name', 'tags']);

        // Load maintenance reports with user info
        $maintenanceReports = $project->maintenanceReports()
            ->with('user:id,name')
            ->orderBy('report_date', 'desc')
            ->get();

        // Get managers (role = manager) for PM select
        $managers = User::where('role', 'manager')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get developers (role = developer) for developer select
        $developers = User::where('role', 'developer')
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get all users for backwards compatibility (used for todo assignees)
        $users = User::select('id', 'name', 'role')->orderBy('name')->get();

        // Get all tags for tag management
        $availableTags = Tag::orderBy('name')->get();

        // Pass user permissions to frontend
        $can = [
            'update' => Gate::allows('update', $project),
            'delete' => Gate::allows('delete', $project),
            'manageCredentials' => Gate::allows('manageCredentials', $project),
            'assignTeam' => Gate::allows('assignTeam', $project),
        ];

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'maintenanceReports' => $maintenanceReports,
            'users' => $users,
            'managers' => $managers,
            'developers' => $developers,
            'availableTags' => $availableTags,
            'can' => $can,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Gate::authorize('create', Project::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url',
            'client_email' => 'nullable|email',
            'notes' => 'nullable|string',
            'health_status' => 'required|in:online,down_error,updating',
            'security_status' => 'required|in:secure,monitoring,compromised,hacked',
            'manager_id' => 'nullable|exists:users,id',
            'developer_id' => 'nullable|exists:users,id',
            'developer_ids' => 'nullable|array',
            'developer_ids.*' => 'exists:users,id',
            'project_external_id' => 'nullable|string|max:255',
            'maintenance_id' => 'nullable|string|max:255',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
            'add_maintenance_todos' => 'nullable|boolean',
        ]);

        // Extract tag_ids, developer_ids, and maintenance todos flag before creating project
        $tagIds = $validated['tag_ids'] ?? [];
        $developerIds = $validated['developer_ids'] ?? [];
        $addMaintenanceTodos = $validated['add_maintenance_todos'] ?? false;
        unset($validated['tag_ids'], $validated['developer_ids'], $validated['add_maintenance_todos']);

        $project = Project::create($validated);

        // Sync tags
        if (!empty($tagIds)) {
            $project->tags()->sync($tagIds);
        }

        // Sync developers
        if (!empty($developerIds)) {
            $project->developers()->sync($developerIds);
            // Send notifications to assigned developers
            foreach ($developerIds as $devId) {
                $developer = User::find($devId);
                $developer?->notify(new ProjectAssignedNotification($project, 'developer'));
            }
        }

        // Send notifications to assigned users
        if ($project->manager_id) {
            $manager = User::find($project->manager_id);
            $manager?->notify(new ProjectAssignedNotification($project, 'manager'));
        }
        if ($project->developer_id) {
            $developer = User::find($project->developer_id);
            $developer?->notify(new ProjectAssignedNotification($project, 'developer'));
        }

        // Create maintenance init todos if requested
        if ($addMaintenanceTodos) {
            $maintenanceTodos = [
                ['title' => 'Check if Wordfence is installed', 'priority' => 'critical'],
                ['title' => 'Check if our new theme is installed', 'priority' => 'high'],
                ['title' => 'Check if new plugin for forms is installed', 'priority' => 'high'],
                ['title' => 'Check if database is clean', 'priority' => 'critical'],
                ['title' => 'Check if malicious files on server/file system', 'priority' => 'critical'],
            ];

            foreach ($maintenanceTodos as $todo) {
                Todo::create([
                    'project_id' => $project->id,
                    'title' => $todo['title'],
                    'priority' => $todo['priority'],
                    'status' => 'pending',
                ]);
            }
        }

        return redirect()->route('projects.show', $project)
            ->with('success', 'Project created successfully!');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project)
    {
        Gate::authorize('update', $project);

        $user = Auth::user();
        
        $rules = [
            'name' => 'sometimes|required|string|max:255',
            'url' => 'sometimes|required|url',
            'client_email' => 'nullable|email',
            'notes' => 'nullable|string',
            'health_status' => 'sometimes|required|in:online,down_error,updating',
            'security_status' => 'sometimes|required|in:secure,monitoring,compromised,hacked',
            'project_external_id' => 'nullable|string|max:255',
            'maintenance_id' => 'nullable|string|max:255',
            'health_check_secret' => 'nullable|string|max:255',
            'tag_ids' => 'nullable|array',
            'tag_ids.*' => 'exists:tags,id',
        ];

        // Only admins can change the manager
        if ($user->isAdmin()) {
            $rules['manager_id'] = 'nullable|exists:users,id';
        }

        // Admins and managers can change the developer
        if ($user->isAdmin() || $user->isManager()) {
            $rules['developer_id'] = 'nullable|exists:users,id';
            $rules['developer_ids'] = 'nullable|array';
            $rules['developer_ids.*'] = 'exists:users,id';
        }

        $validated = $request->validate($rules);

        // Track changes for notifications
        $oldManagerId = $project->manager_id;
        $oldDeveloperId = $project->developer_id;
        $oldDeveloperIds = $project->developers->pluck('id')->toArray();
        $oldHealthStatus = $project->health_status;
        $oldSecurityStatus = $project->security_status;

        // Extract tag_ids and developer_ids before updating project
        $tagIds = $validated['tag_ids'] ?? null;
        $developerIds = $validated['developer_ids'] ?? null;
        unset($validated['tag_ids'], $validated['developer_ids']);

        $project->update($validated);

        // Sync tags if provided
        if ($tagIds !== null) {
            $project->tags()->sync($tagIds);
        }

        // Sync developers if provided
        if ($developerIds !== null) {
            $project->developers()->sync($developerIds);
            // Send notifications to newly assigned developers
            $newDeveloperIds = array_diff($developerIds, $oldDeveloperIds);
            foreach ($newDeveloperIds as $devId) {
                $developer = User::find($devId);
                $developer?->notify(new ProjectAssignedNotification($project, 'developer'));
            }
        }

        // Send notifications for assignment changes
        if (isset($validated['manager_id']) && $validated['manager_id'] != $oldManagerId && $validated['manager_id']) {
            $newManager = User::find($validated['manager_id']);
            $newManager?->notify(new ProjectAssignedNotification($project, 'manager'));
        }
        if (isset($validated['developer_id']) && $validated['developer_id'] != $oldDeveloperId && $validated['developer_id']) {
            $newDeveloper = User::find($validated['developer_id']);
            $newDeveloper?->notify(new ProjectAssignedNotification($project, 'developer'));
        }

        // Send notifications for status changes to assigned team members
        $teamMembers = collect();
        if ($project->manager_id) {
            $teamMembers->push(User::find($project->manager_id));
        }
        if ($project->developer_id) {
            $teamMembers->push(User::find($project->developer_id));
        }
        // Include all developers from the many-to-many relationship
        foreach ($project->developers as $developer) {
            $teamMembers->push($developer);
        }
        $teamMembers = $teamMembers->filter()->unique('id');

        if ($project->health_status !== $oldHealthStatus) {
            foreach ($teamMembers as $member) {
                $member->notify(new ProjectStatusChangedNotification(
                    $project, 'health', $oldHealthStatus, $project->health_status
                ));
            }
        }

        if ($project->security_status !== $oldSecurityStatus) {
            foreach ($teamMembers as $member) {
                $member->notify(new ProjectStatusChangedNotification(
                    $project, 'security', $oldSecurityStatus, $project->security_status
                ));
            }
        }

        return back()->with('success', 'Project updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project)
    {
        Gate::authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')
            ->with('success', 'Project deleted successfully!');
    }

    /**
     * Manually trigger a health check for a project.
     */
    public function checkHealth(Project $project)
    {
        Gate::authorize('update', $project);

        if (empty($project->health_check_secret)) {
            return response()->json([
                'success' => false,
                'message' => 'Health monitoring secret not configured',
            ], 400);
        }

        if (empty($project->url)) {
            return response()->json([
                'success' => false,
                'message' => 'Project URL not configured',
            ], 400);
        }

        try {
            $baseUrl = rtrim($project->url, '/');
            $healthUrl = "{$baseUrl}/wp-json/lsm/v1/health?key={$project->health_check_secret}";
            
            $startTime = microtime(true);
            $response = \Illuminate\Support\Facades\Http::timeout(15)->get($healthUrl);
            $responseTime = round((microtime(true) - $startTime) * 1000);
            
            if ($response->successful()) {
                $healthData = $response->json();
                
                // Update project with health data
                $project->update([
                    'last_health_check_at' => now(),
                    'response_time_ms' => $responseTime,
                    'last_health_details' => $healthData,
                    'wp_version' => $healthData['wordpress']['version'] ?? null,
                    'php_version' => $healthData['php']['version'] ?? null,
                    'outdated_plugins_count' => $healthData['plugins']['outdated_count'] ?? null,
                    'ssl_status' => ($healthData['ssl']['enabled'] ?? false) ? 'valid' : 'none',
                    // Auto-update health status based on response
                    'health_status' => $this->determineHealthStatus($healthData),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Health check completed successfully',
                    'data' => $healthData,
                ]);
            } else {
                // API returned error (500, 404, 403, etc.)
                $errorMessage = 'HTTP ' . $response->status();
                
                $project->update([
                    'last_health_check_at' => now(),
                    'response_time_ms' => $responseTime,
                    'health_status' => 'down_error',
                    'last_health_details' => [
                        'error' => true,
                        'error_type' => 'http_error',
                        'error_code' => $response->status(),
                        'error_message' => $errorMessage,
                        'checked_at' => now()->toIso8601String(),
                    ],
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Health check endpoint returned error: ' . $errorMessage,
                ], 400);
            }
        } catch (\Exception $e) {
            // Connection failed (timeout, DNS error, site down, etc.)
            $project->update([
                'last_health_check_at' => now(),
                'health_status' => 'down_error',
                'last_health_details' => [
                    'error' => true,
                    'error_type' => 'connection_error',
                    'error_message' => $e->getMessage(),
                    'checked_at' => now()->toIso8601String(),
                ],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to connect: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Determine health status based on health data.
     */
    private function determineHealthStatus(array $healthData): string
    {
        // Critical issues = down/error
        if (!($healthData['ssl']['enabled'] ?? true)) {
            return 'down_error';
        }

        // Warning issues = updating/maintenance
        if (($healthData['updates']['core_update_available'] ?? false) || 
            ($healthData['plugins']['outdated_count'] ?? 0) > 5 ||
            ($healthData['security']['debug_mode'] ?? false)) {
            return 'updating';
        }

        return 'online';
    }
}
