<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Api\StoreProjectRequest;
use App\Http\Requests\Api\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\TagResource;
use App\Http\Resources\UserResource;
use App\Models\Project;
use App\Models\Tag;
use App\Models\Todo;
use App\Models\User;
use App\Notifications\ProjectAssignedNotification;
use App\Notifications\ProjectStatusChangedNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;

/**
 * Project Controller
 * 
 * Full CRUD API for projects with filtering, pagination, and health checks.
 */
class ProjectController extends Controller
{
    /**
     * Display a paginated listing of projects.
     *
     * @param Request $request
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection
     */
    public function index(Request $request)
    {
        Gate::authorize('viewAny', Project::class);

        $user = $request->user();
        
        $query = Project::query()
            ->with(['manager:id,name,email', 'developer:id,name,email', 'developers:id,name,email', 'tags'])
            ->withCount(['todos', 'credentials', 'resources', 'maintenanceReports'])
            ->withCount(['todos as pending_todos_count' => fn($q) => $q->where('status', '!=', 'completed')]);

        // Role-based filtering
        if ($user->role === 'developer') {
            $query->where(function($q) use ($user) {
                $q->where('developer_id', $user->id)
                  ->orWhereHas('developers', fn($sub) => $sub->where('users.id', $user->id));
            });
        } elseif ($user->role === 'manager') {
            $query->where('manager_id', $user->id);
        }
        // Admin sees all

        // Filter by health status
        if ($request->filled('health') && $request->health !== 'all') {
            $query->where('health_status', $request->health);
        }

        // Filter by security status
        if ($request->filled('security') && $request->security !== 'all') {
            $query->where('security_status', $request->security);
        }

        // Filter by manager
        if ($request->filled('manager_id')) {
            $query->where('manager_id', $request->manager_id);
        }

        // Filter by developer
        if ($request->filled('developer_id')) {
            $developerId = $request->developer_id;
            $query->where(function($q) use ($developerId) {
                $q->where('developer_id', $developerId)
                  ->orWhereHas('developers', fn($sub) => $sub->where('users.id', $developerId));
            });
        }

        // Filter by tag
        if ($request->filled('tag')) {
            $query->whereHas('tags', fn($q) => $q->where('slug', $request->tag));
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('url', 'like', "%{$search}%")
                  ->orWhere('client_email', 'like', "%{$search}%")
                  ->orWhere('project_external_id', 'like', "%{$search}%");
            });
        }

        $perPage = min($request->integer('per_page', 15), 100);
        $projects = $query->orderBy('updated_at', 'desc')->paginate($perPage);

        return ProjectResource::collection($projects);
    }

    /**
     * Quick search for header autocomplete (max 5 results).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function quickSearch(Request $request): JsonResponse
    {
        $user = $request->user();
        $search = $request->input('q', '');

        if (strlen($search) < 2) {
            return response()->json(['data' => []]);
        }

        $query = Project::query()
            ->select('id', 'name', 'url', 'project_external_id', 'health_status')
            ->with(['tags:id,name,color']);

        // Role-based filtering
        if ($user->role === 'developer') {
            $query->where(function($q) use ($user) {
                $q->where('developer_id', $user->id)
                  ->orWhereHas('developers', fn($sub) => $sub->where('users.id', $user->id));
            });
        } elseif ($user->role === 'manager') {
            $query->where('manager_id', $user->id);
        }

        // Search by name, URL (domain), external_id, or maint_id
        $query->where(function($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('url', 'like', "%{$search}%")
              ->orWhere('project_external_id', 'like', "%{$search}%")
              ->orWhere('id', '=', is_numeric($search) ? (int)$search : 0);
        });

        $projects = $query->limit(5)->get();

        return response()->json([
            'data' => $projects->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'url' => $p->url,
                'external_id' => $p->project_external_id,
                'health_status' => $p->health_status,
                'tags' => $p->tags,
            ]),
        ]);
    }

    /**
     * Display a single project with all relationships.
     *
     * @param Project $project
     * @return ProjectResource
     */
    public function show(Project $project): ProjectResource
    {
        Gate::authorize('view', $project);

        $project->load([
            'credentials',
            'resources',
            'todos.assignee:id,name,email',
            'manager:id,name,email',
            'developer:id,name,email',
            'developers:id,name,email',
            'tags',
            'maintenanceReports.user:id,name',
        ]);

        return new ProjectResource($project);
    }

    /**
     * Store a newly created project.
     *
     * @param StoreProjectRequest $request
     * @return JsonResponse
     */
    public function store(StoreProjectRequest $request): JsonResponse
    {
        Gate::authorize('create', Project::class);

        $validated = $request->validated();

        // Extract relationship arrays before creating project
        $tagIds = $validated['tag_ids'] ?? [];
        $developerIds = $validated['developer_ids'] ?? [];
        $addMaintenanceTodos = $validated['add_maintenance_todos'] ?? false;
        unset($validated['tag_ids'], $validated['developer_ids'], $validated['add_maintenance_todos']);

        // Set defaults
        $validated['health_status'] = $validated['health_status'] ?? 'online';
        $validated['security_status'] = $validated['security_status'] ?? 'secure';

        $project = Project::create($validated);

        // Sync tags
        if (!empty($tagIds)) {
            $project->tags()->sync($tagIds);
        }

        // Sync developers and notify
        if (!empty($developerIds)) {
            $project->developers()->sync($developerIds);
            foreach ($developerIds as $devId) {
                $developer = User::find($devId);
                $developer?->notify(new ProjectAssignedNotification($project, 'developer'));
            }
        }

        // Notify assigned manager
        if ($project->manager_id) {
            $manager = User::find($project->manager_id);
            $manager?->notify(new ProjectAssignedNotification($project, 'manager'));
        }

        // Create maintenance init todos if requested
        if ($addMaintenanceTodos) {
            $this->createMaintenanceTodos($project);
        }

        $project->load(['manager', 'developers', 'tags']);

        return $this->createdResponse(
            new ProjectResource($project),
            'Project created successfully'
        );
    }

    /**
     * Update the specified project.
     *
     * @param UpdateProjectRequest $request
     * @param Project $project
     * @return ProjectResource
     */
    public function update(UpdateProjectRequest $request, Project $project): ProjectResource
    {
        Gate::authorize('update', $project);

        $user = $request->user();
        $validated = $request->validated();

        // Track changes for notifications
        $oldManagerId = $project->manager_id;
        $oldDeveloperIds = $project->developers->pluck('id')->toArray();
        $oldHealthStatus = $project->health_status;
        $oldSecurityStatus = $project->security_status;

        // Extract relationship arrays
        $tagIds = $validated['tag_ids'] ?? null;
        $developerIds = $validated['developer_ids'] ?? null;
        unset($validated['tag_ids'], $validated['developer_ids']);

        // Role-based restrictions for assignments
        if (!$user->isAdmin()) {
            unset($validated['manager_id']);
        }
        if (!$user->isAdmin() && !$user->isManager()) {
            // Developers can't change developer assignments
            $developerIds = null;
        }

        $project->update($validated);

        // Sync tags if provided
        if ($tagIds !== null) {
            $project->tags()->sync($tagIds);
        }

        // Sync developers if provided and notify new ones
        if ($developerIds !== null) {
            $project->developers()->sync($developerIds);
            $newDeveloperIds = array_diff($developerIds, $oldDeveloperIds);
            foreach ($newDeveloperIds as $devId) {
                $developer = User::find($devId);
                $developer?->notify(new ProjectAssignedNotification($project, 'developer'));
            }
        }

        // Notify new manager
        if (isset($validated['manager_id']) && $validated['manager_id'] != $oldManagerId && $validated['manager_id']) {
            $newManager = User::find($validated['manager_id']);
            $newManager?->notify(new ProjectAssignedNotification($project, 'manager'));
        }

        // Notify team of status changes
        $this->notifyStatusChanges($project, $oldHealthStatus, $oldSecurityStatus);

        $project->load(['manager', 'developers', 'tags']);

        return new ProjectResource($project);
    }

    /**
     * Remove the specified project.
     *
     * @param Project $project
     * @return JsonResponse
     */
    public function destroy(Project $project): JsonResponse
    {
        Gate::authorize('delete', $project);

        $project->delete();

        return $this->successResponse(null, 'Project deleted successfully');
    }

    /**
     * Manually trigger a health check for a project.
     *
     * @param Project $project
     * @return JsonResponse
     */
    public function checkHealth(Project $project): JsonResponse
    {
        Gate::authorize('update', $project);

        if (empty($project->health_check_secret)) {
            return $this->errorResponse('Health monitoring secret not configured', 400);
        }

        if (empty($project->url)) {
            return $this->errorResponse('Project URL not configured', 400);
        }

        try {
            $baseUrl = rtrim($project->url, '/');
            $healthUrl = "{$baseUrl}/wp-json/lsm/v1/health?key={$project->health_check_secret}";
            
            $startTime = microtime(true);
            $response = Http::timeout(15)->get($healthUrl);
            $responseTime = round((microtime(true) - $startTime) * 1000);
            
            if ($response->successful()) {
                $healthData = $response->json();
                
                $project->update([
                    'last_health_check_at' => now(),
                    'response_time_ms' => $responseTime,
                    'last_health_details' => $healthData,
                    'wp_version' => $healthData['wordpress']['version'] ?? null,
                    'php_version' => $healthData['php']['version'] ?? null,
                    'outdated_plugins_count' => $healthData['plugins']['outdated_count'] ?? null,
                    'ssl_status' => ($healthData['ssl']['enabled'] ?? false) ? 'valid' : 'none',
                    'health_status' => $this->determineHealthStatus($healthData),
                ]);

                return $this->successResponse([
                    'health_data' => $healthData,
                    'response_time_ms' => $responseTime,
                    'project' => new ProjectResource($project->fresh()),
                ], 'Health check completed successfully');
            } else {
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

                return $this->errorResponse('Health check endpoint returned error: ' . $errorMessage, 400);
            }
        } catch (\Exception $e) {
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

            return $this->errorResponse('Failed to connect: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get filter options (managers, developers, tags) for the projects list.
     *
     * @return JsonResponse
     */
    public function filterOptions(): JsonResponse
    {
        return $this->successResponse([
            'managers' => UserResource::collection(
                User::where('role', 'manager')->select('id', 'name', 'email')->orderBy('name')->get()
            ),
            'developers' => UserResource::collection(
                User::where('role', 'developer')->select('id', 'name', 'email')->orderBy('name')->get()
            ),
            'tags' => TagResource::collection(
                Tag::orderBy('name')->get()
            ),
            'health_statuses' => ['online', 'down_error', 'updating'],
            'security_statuses' => ['secure', 'monitoring', 'compromised', 'hacked'],
        ]);
    }

    /**
     * Get project statistics (overall, not filtered).
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        return $this->successResponse([
            'total' => Project::count(),
            'online' => Project::where('health_status', 'online')->count(),
            'secure' => Project::where('security_status', 'secure')->count(),
            'issues' => Project::where(function($q) {
                $q->whereIn('health_status', ['offline', 'down_error'])
                  ->orWhereIn('security_status', ['hacked', 'compromised']);
            })->count(),
        ]);
    }

    /**
     * Create standard maintenance todos for a new project.
     */
    private function createMaintenanceTodos(Project $project): void
    {
        $todos = [
            ['title' => 'Check if Wordfence is installed', 'priority' => 'critical'],
            ['title' => 'Check if our new theme is installed', 'priority' => 'high'],
            ['title' => 'Check if new plugin for forms is installed', 'priority' => 'high'],
            ['title' => 'Check if database is clean', 'priority' => 'critical'],
            ['title' => 'Check if malicious files on server/file system', 'priority' => 'critical'],
        ];

        foreach ($todos as $todo) {
            Todo::create([
                'project_id' => $project->id,
                'title' => $todo['title'],
                'priority' => $todo['priority'],
                'status' => 'pending',
            ]);
        }
    }

    /**
     * Determine health status based on health check data.
     */
    private function determineHealthStatus(array $healthData): string
    {
        if (!($healthData['ssl']['enabled'] ?? true)) {
            return 'down_error';
        }

        if (($healthData['updates']['core_update_available'] ?? false) || 
            ($healthData['plugins']['outdated_count'] ?? 0) > 5 ||
            ($healthData['security']['debug_mode'] ?? false)) {
            return 'updating';
        }

        return 'online';
    }

    /**
     * Notify team members of status changes.
     */
    private function notifyStatusChanges(Project $project, string $oldHealthStatus, string $oldSecurityStatus): void
    {
        if ($project->health_status === $oldHealthStatus && $project->security_status === $oldSecurityStatus) {
            return;
        }

        $teamMembers = collect();
        
        if ($project->manager_id) {
            $teamMembers->push(User::find($project->manager_id));
        }
        if ($project->developer_id) {
            $teamMembers->push(User::find($project->developer_id));
        }
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
    }
}
