# MCP Server Planning — LSM Platform AI Integration

> A comprehensive plan for creating a Model Context Protocol (MCP) server that enables AI-powered remote management of the LSM (Landeseiten Maintenance) platform.

---

## 🎯 Goal

Build an MCP server that allows AI assistants (Claude, GPT, etc.) to:
- Query and understand the current state of all managed WordPress sites
- Execute maintenance actions remotely
- Manage todos, time tracking, and team workflows
- Generate reports and provide intelligent recommendations

---

## ✅ Architecture Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| **Hosting** | Deployed (Production) | Whole team can use it via their AI clients |
| **Tech Stack** | PHP/Laravel | Use `laravel/mcp` package, keep everything in one codebase |
| **Multi-user** | Yes | Use existing Sanctum tokens; AI sees only permitted projects |
| **Transport** | SSE (Server-Sent Events) | MCP standard for web servers, easy in Laravel |

---

## 📚 What is MCP?

**Model Context Protocol (MCP)** is an open standard developed by Anthropic for connecting AI assistants to external data sources and tools. It provides:

- **Resources**: Read-only data the AI can query (like database views)
- **Tools**: Actions the AI can execute (like API calls)
- **Prompts**: Predefined interaction patterns

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      AI Clients (Team Members)                           │
│                                                                          │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│   │ Claude (Max) │   │ Claude (Anna)│   │ Claude (Tom) │                │
│   │ Token: abc123│   │ Token: xyz789│   │ Token: def456│                │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘                │
│          │                  │                  │                         │
│          └──────────────────┼──────────────────┘                         │
│                             │ MCP over SSE (HTTPS)                       │
└─────────────────────────────┼───────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    LSM Laravel Backend (Production)                      │
│                    https://app.landeseiten.de                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │                     MCP Server Module                           │    │
│   │                     (laravel/mcp package)                       │    │
│   │                                                                 │    │
│   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │    │
│   │   │  Resources   │  │    Tools     │  │   Prompts    │         │    │
│   │   │              │  │              │  │              │         │    │
│   │   │ • Projects   │  │ • startTimer │  │ • morning    │         │    │
│   │   │ • Todos      │  │ • createTodo │  │   briefing   │         │    │
│   │   │ • Time       │  │ • wpHealth   │  │ • weekly     │         │    │
│   │   │ • Vault      │  │ • wpCache    │  │   report     │         │    │
│   │   └──────────────┘  └──────────────┘  └──────────────┘         │    │
│   │                                                                 │    │
│   │                  ┌────────────────────┐                         │    │
│   │                  │ Sanctum Auth Guard │                         │    │
│   │                  │ (Per-User Tokens)  │                         │    │
│   │                  └────────────────────┘                         │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                  │                                       │
│                                  ▼                                       │
│   ┌────────────────────────────────────────────────────────────────┐    │
│   │              Existing Services & Models                         │    │
│   │   LsmService, RmbService, ProjectPolicy, TimeEntryPolicy, etc  │    │
│   └────────────────────────────────────────────────────────────────┘    │
│                                  │                                       │
│                                  ▼                                       │
│   ┌──────────────────┐    ┌─────────────────────────────────────┐       │
│   │     Database     │    │       WordPress Sites (RMB)          │       │
│   │   MySQL/SQLite   │    │   (via existing plugin integration)  │       │
│   └──────────────────┘    └─────────────────────────────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Multi-User Token Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Token-Based Access                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Developer "Max" (role: developer)                                   │
│  ├─ Sees: Only projects assigned to him                             │
│  ├─ Can: Start/stop timer, update todos, view own credentials       │
│  └─ Cannot: Approve timesheets, manage team, admin actions          │
│                                                                      │
│  Manager "Anna" (role: manager)                                      │
│  ├─ Sees: All projects she manages                                  │
│  ├─ Can: Approve timesheets, assign todos, view team availability   │
│  └─ Cannot: Delete users, billing management                        │
│                                                                      │
│  Admin "Tom" (role: admin)                                           │
│  ├─ Sees: Everything                                                │
│  └─ Can: All actions including user management                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Proposed MCP Tools

Tools allow the AI to **perform actions** on the LSM platform. All tools respect the authenticated user's permissions via existing Laravel policies.

### Project Management

| Tool Name | Description | Parameters | Permission |
|-----------|-------------|------------|------------|
| `lsm_list_projects` | Get all accessible projects | `status?`, `tag?` | All roles |
| `lsm_get_project` | Get full details of a project | `project_id` | Project access |
| `lsm_check_health` | Trigger health check on a site | `project_id` | Project access |
| `lsm_search_projects` | Quick search by name/URL | `query` | All roles |

### WordPress Remote Actions (RMB)

| Tool Name | Description | Parameters | Permission |
|-----------|-------------|------------|------------|
| `lsm_wp_login` | Generate SSO login URL | `project_id` | Project access |
| `lsm_wp_maintenance_on` | Enable maintenance mode | `project_id` | Project access |
| `lsm_wp_maintenance_off` | Disable maintenance mode | `project_id` | Project access |
| `lsm_wp_clear_cache` | Clear all caches | `project_id` | Project access |
| `lsm_wp_update_plugins` | Update all plugins | `project_id` | Manager+ |
| `lsm_wp_update_core` | Update WordPress core | `project_id` | Manager+ |
| `lsm_wp_get_updates` | List available updates | `project_id` | Project access |
| `lsm_wp_emergency_recovery` | Run emergency recovery | `project_id` | Manager+ |

### Todo / Task Management

| Tool Name | Description | Parameters | Permission |
|-----------|-------------|------------|------------|
| `lsm_list_todos` | Get todos with filters | `project_id?`, `status?` | Project access |
| `lsm_get_my_todos` | Get assigned todos | `priority?`, `status?` | All roles |
| `lsm_create_todo` | Create a new todo | `project_id`, `title`, `description?`, `priority?` | Project access |
| `lsm_update_todo` | Update todo | `todo_id`, `status?`, `priority?` | Todo assignee/manager |
| `lsm_complete_todo` | Mark todo as done | `todo_id` | Todo assignee/manager |

### Time Tracking

| Tool Name | Description | Parameters | Permission |
|-----------|-------------|------------|------------|
| `lsm_start_timer` | Start tracking time | `project_id`, `todo_id?`, `description?` | Project access |
| `lsm_stop_timer` | Stop current timer | `notes?` | Timer owner |
| `lsm_get_timer` | Get current timer status | — | All roles |
| `lsm_log_time` | Manually log time | `project_id`, `minutes`, `description`, `date?` | Project access |
| `lsm_get_time_today` | Get today's entries | — | All roles |
| `lsm_submit_timesheet` | Submit for approval | `timesheet_id` | Timesheet owner |

### Approvals (Manager+)

| Tool Name | Description | Parameters | Permission |
|-----------|-------------|------------|------------|
| `lsm_pending_approvals` | Get pending timesheets | — | Manager+ |
| `lsm_approve_timesheet` | Approve a timesheet | `timesheet_id` | Manager of project |
| `lsm_reject_timesheet` | Reject with reason | `timesheet_id`, `reason` | Manager of project |

### Credentials / Vault

| Tool Name | Description | Parameters | Permission |
|-----------|-------------|------------|------------|
| `lsm_list_vault` | Get accessible credentials | `project_id?` | Project access |
| `lsm_reveal_credential` | Reveal password (logged) | `credential_id`, `reason?` | Project access |
| `lsm_share_credential` | Create temporary share link | `credential_id`, `expires_hours?` | Project access |

### Dashboard & Notifications

| Tool Name | Description | Parameters | Permission |
|-----------|-------------|------------|------------|
| `lsm_dashboard` | Get dashboard stats | — | All roles |
| `lsm_notifications` | Get notifications | `unread_only?` | All roles |
| `lsm_mark_read` | Mark notifications read | `notification_ids` | All roles |

---

## 📖 Proposed MCP Resources

Resources provide **read-only data snapshots** that the AI can access to understand the current state. All resources respect user permissions.

| Resource URI | Description | Data Shape |
|--------------|-------------|------------|
| `lsm://dashboard` | User's dashboard summary | `{projectCount, activeTodos, hoursToday, notifications}` |
| `lsm://projects` | All accessible projects | `Array<{id, name, url, status, manager}>` |
| `lsm://projects/{id}` | Full project details | `{...project, wpHealth, todos, credentials}` |
| `lsm://projects/{id}/health` | WordPress health data | `{wpVersion, php, plugins, ssl, security}` |
| `lsm://todos/mine` | User's assigned todos | `Array<{id, title, project, priority, status}>` |
| `lsm://todos/urgent` | Urgent todos across projects | `Array<Todo>` (priority=urgent) |
| `lsm://time/today` | Today's time entries | `{entries: Array, totalMinutes, activeTimer?}` |
| `lsm://time/week` | This week's timesheet | `{entries: Array, totalHours, status}` |
| `lsm://vault` | All accessible credentials | `Array<{id, label, project, username}>` |
| `lsm://team` | Team members (manager+) | `Array<{id, name, role, availability}>` |
| `lsm://sites/at-risk` | Sites with issues | `Array<Project>` where status='at_risk' |
| `lsm://sites/offline` | Offline sites | `Array<Project>` where status='offline' |
| `lsm://approvals/pending` | Pending timesheets (manager+) | `Array<Timesheet>` |

---

## 💬 Proposed MCP Prompts

Prompts are predefined conversation starters for common workflows.

### `morning_briefing`
```
Summarize my LSM dashboard including:
- Sites that are offline or at risk
- My urgent todos
- Time tracked so far today
- Pending approvals (if I'm a manager)
- Unread notifications
```

### `weekly_status`
```
Generate a weekly summary:
- Total hours tracked per project
- Todos completed vs created
- Health status changes
- Issues that emerged
```

### `project_handoff`
```
Prepare a handoff for project {project_id}:
- Current WordPress status
- Open todos
- Recent time entries
- Credential labels (not passwords)
```

### `maintenance_session`
```
I'm doing maintenance on {project_id}. Help me:
1. Check current health
2. Enable maintenance mode
3. List available updates
4. Start time tracking
```

---

## 🏗 Implementation Plan

### Phase 1: Package Setup & Configuration (Day 1-2)

#### 1.1 Install laravel/mcp Package

```bash
composer require laravel/mcp
php artisan mcp:install
```

#### 1.2 Configure MCP Server

```php
// config/mcp.php
return [
    'enabled' => env('MCP_ENABLED', true),
    
    // SSE endpoint path
    'path' => '/mcp',
    
    // Authentication guard
    'guard' => 'sanctum',
    
    // Rate limiting
    'rate_limit' => 60, // requests per minute
    
    // Server metadata
    'server' => [
        'name' => 'LSM Platform',
        'version' => '1.0.0',
    ],
];
```

#### 1.3 Add MCP Routes

```php
// routes/mcp.php
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'mcp'])->group(function () {
    // MCP SSE endpoint
    Route::get('/mcp', [McpController::class, 'handle']);
    Route::post('/mcp', [McpController::class, 'handle']);
});
```

---

### Phase 2: Core Resources (Day 3-5)

Create resource providers that leverage existing models and services.

#### 2.1 Dashboard Resource

```php
// app/Mcp/Resources/DashboardResource.php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Resources\Resource;
use App\Models\Project;
use App\Models\Todo;
use App\Models\TimeEntry;

class DashboardResource extends Resource
{
    public string $uri = 'lsm://dashboard';
    public string $name = 'Dashboard Summary';
    public string $description = 'Overview of your LSM platform status';
    
    public function read(): array
    {
        $user = auth()->user();
        
        return [
            'projects' => [
                'total' => $user->accessibleProjects()->count(),
                'at_risk' => $user->accessibleProjects()->where('status', 'at_risk')->count(),
                'offline' => $user->accessibleProjects()->where('status', 'offline')->count(),
            ],
            'todos' => [
                'assigned' => Todo::assignedTo($user)->where('status', '!=', 'completed')->count(),
                'urgent' => Todo::assignedTo($user)->where('priority', 'urgent')->count(),
            ],
            'time' => [
                'today_minutes' => TimeEntry::forUser($user)->today()->sum('duration_minutes'),
                'active_timer' => TimeEntry::forUser($user)->running()->first()?->toArray(),
            ],
            'notifications' => [
                'unread' => $user->unreadNotifications()->count(),
            ],
        ];
    }
}
```

#### 2.2 Projects Resource

```php
// app/Mcp/Resources/ProjectsResource.php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Resources\Resource;
use App\Http\Resources\ProjectResource as ProjectApiResource;

class ProjectsResource extends Resource
{
    public string $uri = 'lsm://projects';
    public string $name = 'Projects List';
    public string $description = 'All WordPress projects you have access to';
    
    public function read(): array
    {
        $projects = auth()->user()
            ->accessibleProjects()
            ->with(['manager', 'tags'])
            ->get();
            
        return ProjectApiResource::collection($projects)->resolve();
    }
}
```

#### 2.3 Parameterized Project Resource

```php
// app/Mcp/Resources/ProjectDetailResource.php
<?php

namespace App\Mcp\Resources;

use Laravel\Mcp\Resources\Resource;
use App\Models\Project;

class ProjectDetailResource extends Resource
{
    public string $uri = 'lsm://projects/{id}';
    public string $name = 'Project Details';
    public string $description = 'Full details of a specific project';
    
    public function read(int $id): array
    {
        $project = Project::findOrFail($id);
        
        // Policy check
        $this->authorize('view', $project);
        
        return [
            'project' => $project->load(['manager', 'developers', 'tags']),
            'health' => $project->latestHealthCheck,
            'todos' => $project->todos()->where('status', '!=', 'completed')->get(),
            'recent_time' => $project->timeEntries()->latest()->take(10)->get(),
        ];
    }
}
```

---

### Phase 3: Core Tools (Day 6-10)

Implement tools that wrap existing controllers and services.

#### 3.1 Timer Tools

```php
// app/Mcp/Tools/TimerTools.php
<?php

namespace App\Mcp\Tools;

use Laravel\Mcp\Tools\Tool;
use App\Services\TimerService;

class StartTimerTool extends Tool
{
    public string $name = 'lsm_start_timer';
    public string $description = 'Start tracking time for a project or todo';
    
    public function inputSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'project_id' => [
                    'type' => 'integer',
                    'description' => 'Project ID to track time for',
                ],
                'todo_id' => [
                    'type' => 'integer',
                    'description' => 'Optional: Link to specific todo',
                ],
                'description' => [
                    'type' => 'string',
                    'description' => 'What you are working on',
                ],
            ],
            'required' => ['project_id'],
        ];
    }
    
    public function execute(array $input): array
    {
        $service = app(TimerService::class);
        
        $entry = $service->start(
            auth()->user(),
            $input['project_id'],
            $input['todo_id'] ?? null,
            $input['description'] ?? null
        );
        
        return [
            'success' => true,
            'message' => 'Timer started',
            'entry' => $entry->toArray(),
        ];
    }
}

class StopTimerTool extends Tool
{
    public string $name = 'lsm_stop_timer';
    public string $description = 'Stop the currently running timer';
    
    public function inputSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'notes' => [
                    'type' => 'string',
                    'description' => 'Optional notes about work completed',
                ],
            ],
        ];
    }
    
    public function execute(array $input): array
    {
        $service = app(TimerService::class);
        
        $entry = $service->stop(auth()->user(), $input['notes'] ?? null);
        
        if (!$entry) {
            return [
                'success' => false,
                'message' => 'No active timer found',
            ];
        }
        
        return [
            'success' => true,
            'message' => "Timer stopped. Duration: {$entry->formatted_duration}",
            'entry' => $entry->toArray(),
        ];
    }
}
```

#### 3.2 WordPress Remote Tools

```php
// app/Mcp/Tools/WordPressTools.php
<?php

namespace App\Mcp\Tools;

use Laravel\Mcp\Tools\Tool;
use App\Services\LsmService;
use App\Models\Project;

class WpClearCacheTool extends Tool
{
    public string $name = 'lsm_wp_clear_cache';
    public string $description = 'Clear all caches on a WordPress site';
    
    public function inputSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'project_id' => [
                    'type' => 'integer',
                    'description' => 'Project ID of the WordPress site',
                ],
            ],
            'required' => ['project_id'],
        ];
    }
    
    public function execute(array $input): array
    {
        $project = Project::findOrFail($input['project_id']);
        $this->authorize('view', $project);
        
        $service = app(LsmService::class);
        $result = $service->clearCache($project);
        
        return [
            'success' => $result['success'] ?? false,
            'message' => $result['message'] ?? 'Cache cleared',
            'project' => $project->name,
        ];
    }
}

class WpEnableMaintenanceTool extends Tool
{
    public string $name = 'lsm_wp_maintenance_on';
    public string $description = 'Enable maintenance mode on a WordPress site';
    
    public function inputSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'project_id' => [
                    'type' => 'integer',
                    'description' => 'Project ID',
                ],
            ],
            'required' => ['project_id'],
        ];
    }
    
    public function execute(array $input): array
    {
        $project = Project::findOrFail($input['project_id']);
        $this->authorize('view', $project);
        
        $service = app(LsmService::class);
        $result = $service->enableMaintenance($project);
        
        return [
            'success' => $result['success'] ?? false,
            'message' => "Maintenance mode enabled on {$project->name}",
        ];
    }
}
```

#### 3.3 Todo Tools

```php
// app/Mcp/Tools/TodoTools.php
<?php

namespace App\Mcp\Tools;

use Laravel\Mcp\Tools\Tool;
use App\Models\Todo;
use App\Models\Project;

class CreateTodoTool extends Tool
{
    public string $name = 'lsm_create_todo';
    public string $description = 'Create a new todo for a project';
    
    public function inputSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'project_id' => ['type' => 'integer', 'description' => 'Project ID'],
                'title' => ['type' => 'string', 'description' => 'Todo title'],
                'description' => ['type' => 'string', 'description' => 'Detailed description'],
                'priority' => [
                    'type' => 'string',
                    'enum' => ['low', 'medium', 'high', 'urgent'],
                    'description' => 'Priority level',
                ],
                'assignee_id' => ['type' => 'integer', 'description' => 'User ID to assign'],
            ],
            'required' => ['project_id', 'title'],
        ];
    }
    
    public function execute(array $input): array
    {
        $project = Project::findOrFail($input['project_id']);
        $this->authorize('update', $project);
        
        $todo = $project->todos()->create([
            'title' => $input['title'],
            'description' => $input['description'] ?? null,
            'priority' => $input['priority'] ?? 'medium',
            'assigned_to' => $input['assignee_id'] ?? auth()->id(),
            'created_by' => auth()->id(),
            'status' => 'pending',
        ]);
        
        return [
            'success' => true,
            'message' => "Todo created: {$todo->title}",
            'todo' => $todo->toArray(),
        ];
    }
}

class CompleteTodoTool extends Tool
{
    public string $name = 'lsm_complete_todo';
    public string $description = 'Mark a todo as completed';
    
    public function inputSchema(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'todo_id' => ['type' => 'integer', 'description' => 'Todo ID'],
            ],
            'required' => ['todo_id'],
        ];
    }
    
    public function execute(array $input): array
    {
        $todo = Todo::findOrFail($input['todo_id']);
        $this->authorize('update', $todo);
        
        $todo->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);
        
        return [
            'success' => true,
            'message' => "Todo completed: {$todo->title}",
        ];
    }
}
```

---

### Phase 4: Prompts & Service Provider (Day 11-12)

#### 4.1 Register MCP Components

```php
// app/Providers/McpServiceProvider.php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Mcp\Facades\Mcp;

// Resources
use App\Mcp\Resources\DashboardResource;
use App\Mcp\Resources\ProjectsResource;
use App\Mcp\Resources\ProjectDetailResource;
use App\Mcp\Resources\MyTodosResource;
use App\Mcp\Resources\TimeTodayResource;
use App\Mcp\Resources\VaultResource;

// Tools
use App\Mcp\Tools\StartTimerTool;
use App\Mcp\Tools\StopTimerTool;
use App\Mcp\Tools\CreateTodoTool;
use App\Mcp\Tools\CompleteTodoTool;
use App\Mcp\Tools\WpClearCacheTool;
use App\Mcp\Tools\WpEnableMaintenanceTool;
use App\Mcp\Tools\WpDisableMaintenanceTool;
use App\Mcp\Tools\WpGetUpdatesTool;

// Prompts
use App\Mcp\Prompts\MorningBriefingPrompt;
use App\Mcp\Prompts\WeeklyStatusPrompt;

class McpServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Register Resources
        Mcp::resource(DashboardResource::class);
        Mcp::resource(ProjectsResource::class);
        Mcp::resource(ProjectDetailResource::class);
        Mcp::resource(MyTodosResource::class);
        Mcp::resource(TimeTodayResource::class);
        Mcp::resource(VaultResource::class);
        
        // Register Tools
        Mcp::tool(StartTimerTool::class);
        Mcp::tool(StopTimerTool::class);
        Mcp::tool(CreateTodoTool::class);
        Mcp::tool(CompleteTodoTool::class);
        Mcp::tool(WpClearCacheTool::class);
        Mcp::tool(WpEnableMaintenanceTool::class);
        Mcp::tool(WpDisableMaintenanceTool::class);
        Mcp::tool(WpGetUpdatesTool::class);
        
        // Register Prompts
        Mcp::prompt(MorningBriefingPrompt::class);
        Mcp::prompt(WeeklyStatusPrompt::class);
    }
}
```

#### 4.2 Morning Briefing Prompt

```php
// app/Mcp/Prompts/MorningBriefingPrompt.php
<?php

namespace App\Mcp\Prompts;

use Laravel\Mcp\Prompts\Prompt;

class MorningBriefingPrompt extends Prompt
{
    public string $name = 'morning_briefing';
    public string $description = 'Get a comprehensive morning summary of your LSM status';
    
    public function arguments(): array
    {
        return []; // No arguments needed
    }
    
    public function messages(): array
    {
        return [
            [
                'role' => 'user',
                'content' => <<<'PROMPT'
Please give me a morning briefing for my LSM dashboard. Include:

1. **Site Status**: Any WordPress sites that are offline, at risk, or have security issues
2. **My Tasks**: My urgent and high-priority todos for today
3. **Time Tracking**: How much time I've logged today and if there's an active timer
4. **Approvals**: Any pending timesheet approvals (if I'm a manager)
5. **Notifications**: Important unread notifications

Present this in a clear, scannable format. Highlight anything that needs immediate attention.
PROMPT
            ],
        ];
    }
}
```

---

### Phase 5: Testing & Deployment (Day 13-15)

#### 5.1 Feature Tests

```php
// tests/Feature/Mcp/McpToolsTest.php
<?php

namespace Tests\Feature\Mcp;

use Tests\TestCase;
use App\Models\User;
use App\Models\Project;
use Laravel\Sanctum\Sanctum;

class McpToolsTest extends TestCase
{
    public function test_start_timer_tool(): void
    {
        $user = User::factory()->create(['role' => 'developer']);
        $project = Project::factory()->create();
        $project->developers()->attach($user);
        
        Sanctum::actingAs($user);
        
        $response = $this->postJson('/mcp', [
            'jsonrpc' => '2.0',
            'method' => 'tools/call',
            'params' => [
                'name' => 'lsm_start_timer',
                'arguments' => [
                    'project_id' => $project->id,
                    'description' => 'Working on feature X',
                ],
            ],
            'id' => 1,
        ]);
        
        $response->assertOk();
        $this->assertDatabaseHas('time_entries', [
            'user_id' => $user->id,
            'project_id' => $project->id,
        ]);
    }
    
    public function test_unauthorized_project_access(): void
    {
        $user = User::factory()->create(['role' => 'developer']);
        $project = Project::factory()->create(); // Not assigned to user
        
        Sanctum::actingAs($user);
        
        $response = $this->postJson('/mcp', [
            'jsonrpc' => '2.0',
            'method' => 'tools/call',
            'params' => [
                'name' => 'lsm_start_timer',
                'arguments' => ['project_id' => $project->id],
            ],
            'id' => 1,
        ]);
        
        $response->assertForbidden();
    }
}
```

#### 5.2 Deployment Steps

```bash
# 1. Install package on production
composer require laravel/mcp

# 2. Publish config
php artisan mcp:install

# 3. Run migrations (if any)
php artisan migrate

# 4. Clear caches
php artisan config:cache
php artisan route:cache

# 5. Test endpoint
curl -X POST https://app.landeseiten.de/mcp \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/list","id":1}'
```

---

## 📁 Project Structure

```
app/
├── Mcp/
│   ├── Resources/
│   │   ├── DashboardResource.php
│   │   ├── ProjectsResource.php
│   │   ├── ProjectDetailResource.php
│   │   ├── ProjectHealthResource.php
│   │   ├── MyTodosResource.php
│   │   ├── UrgentTodosResource.php
│   │   ├── TimeTodayResource.php
│   │   ├── TimeWeekResource.php
│   │   ├── VaultResource.php
│   │   ├── TeamResource.php
│   │   ├── SitesAtRiskResource.php
│   │   └── PendingApprovalsResource.php
│   │
│   ├── Tools/
│   │   ├── ProjectTools.php         # list, get, search, health check
│   │   ├── WordPressTools.php       # WP remote actions
│   │   ├── TodoTools.php            # CRUD, complete
│   │   ├── TimerTools.php           # start, stop, log
│   │   ├── TimesheetTools.php       # submit, approve, reject
│   │   ├── VaultTools.php           # reveal, share
│   │   └── NotificationTools.php    # mark read
│   │
│   └── Prompts/
│       ├── MorningBriefingPrompt.php
│       ├── WeeklyStatusPrompt.php
│       ├── ProjectHandoffPrompt.php
│       └── MaintenanceSessionPrompt.php
│
├── Providers/
│   └── McpServiceProvider.php
│
config/
└── mcp.php

routes/
└── mcp.php

tests/
└── Feature/
    └── Mcp/
        ├── McpResourcesTest.php
        └── McpToolsTest.php
```

---

## 🔐 Security Considerations

### Authentication Flow
1. Each team member creates a personal API token in LSM (Settings → API Tokens)
2. Token is configured in their AI client (Claude Desktop, etc.)
3. All MCP requests include `Authorization: Bearer <token>`
4. Laravel Sanctum validates token and loads user

### Permission Enforcement
- All resources/tools call existing Laravel policies
- AI can only see/do what the token owner can
- Sensitive actions are audit-logged (credential reveals, etc.)

### Rate Limiting
```php
// app/Http/Middleware/McpRateLimit.php
RateLimiter::for('mcp', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()->id);
});
```

### Token Scopes (Future Enhancement)
```php
// Could restrict MCP tokens to specific abilities
$token = $user->createToken('claude-mcp', [
    'projects:read',
    'todos:write',
    'timer:write',
    // No 'credentials:reveal'
]);
```

---

## 🚀 Client Configuration

### Claude Desktop Setup

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "lsm": {
      "url": "https://app.landeseiten.de/mcp",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer YOUR_PERSONAL_SANCTUM_TOKEN"
      }
    }
  }
}
```

### Cursor IDE Setup

```json
// .cursor/mcp.json
{
  "servers": {
    "lsm": {
      "url": "https://app.landeseiten.de/mcp",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer ${LSM_API_TOKEN}"
      }
    }
  }
}
```

---

## 🗓 Implementation Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1**: Setup & Config | 2 days | Package installed, routes configured, SSE working |
| **Phase 2**: Core Resources | 3 days | Dashboard, Projects, Todos, Time resources |
| **Phase 3**: Core Tools | 5 days | Timer, Todos, WordPress tools |
| **Phase 4**: Prompts & Integration | 2 days | Prompts registered, service provider complete |
| **Phase 5**: Testing & Deployment | 3 days | Tests passing, deployed to production |
| **Total** | **~15 days** | Production-ready MCP server |

---

## 🧪 Usage Examples

Once deployed, team members can interact naturally:

### Developer (Max)
```
Max: "What's my morning briefing?"

Claude: [reads lsm://dashboard, lsm://todos/mine, lsm://sites/at-risk]

"Good morning Max! Here's your LSM summary:

📊 **Dashboard**
- You have access to 5 projects
- 2 urgent todos need attention
- 45 minutes tracked today (no active timer)

⚠️ **Sites Needing Attention**
- client-abc.de is showing SSL warning
- hauptseite.com has 3 outdated plugins

✅ **Your Tasks**
1. [URGENT] Fix contact form on client-xyz.de
2. [URGENT] Update WooCommerce on shop-client.de
3. [HIGH] Review staging environment

Would you like me to start a timer for any of these?"
```

### Manager (Anna)
```
Anna: "Show me pending approvals and approve Tom's timesheet"

Claude: [reads lsm://approvals/pending, calls lsm_approve_timesheet]

"I found 2 pending timesheets:

1. Tom's Week 3 (Jan 15-21): 38.5 hours across 4 projects
2. Max's Week 3 (Jan 15-21): 42 hours across 3 projects

✅ I've approved Tom's timesheet. An invoice (#INV-2026-0042) was 
automatically generated for 38.5 hours.

Would you like to review Max's timesheet next?"
```

---

## 💡 Future Enhancements

### Smart Recommendations
- "You haven't checked client-xyz.de in 2 weeks"
- "3 plugins are outdated on hauptseite.com"

### Scheduled Actions
- Daily health checks with notification digest
- Friday timesheet reminder

### Voice Integration
- Works automatically with any voice-enabled AI client

### Analytics Queries
- "Show me time breakdown by project this month"
- "Which sites have the most issues historically?"

---

## Conclusion

By building the MCP server directly in Laravel using the `laravel/mcp` package, you get:

✅ **One Codebase** — No separate Node.js service to maintain  
✅ **Existing Auth** — Sanctum tokens work out of the box  
✅ **Role-Based Access** — Existing policies automatically enforced  
✅ **Team-Wide** — Each member uses their own token  
✅ **Production Ready** — Deployed alongside your main app  

The implementation reuses your existing controllers, services, and policies, making it a relatively thin layer that exposes your Laravel backend to AI assistants via the MCP standard.

---

*Document created: 2026-01-16*  
*Last updated: 2026-01-16*  
*Architecture decisions finalized: 2026-01-16*
*Implementation completed: 2026-01-16*

---

## ✅ Implementation Complete

The MCP server has been fully implemented! Here's what was built:

### Package Installed
- `laravel/mcp` v0.5.2

### Server Class
- `app/Mcp/Servers/LsmServer.php`

### Tools (13)
| Tool | File |
|------|------|
| `get-dashboard` | `GetDashboardTool.php` |
| `list-projects` | `ListProjectsTool.php` |
| `get-project` | `GetProjectTool.php` |
| `wp-login` | `WpLoginTool.php` |
| `wp-clear-cache` | `WpClearCacheTool.php` |
| `wp-maintenance-on` | `WpEnableMaintenanceTool.php` |
| `wp-maintenance-off` | `WpDisableMaintenanceTool.php` |
| `wp-get-updates` | `WpGetUpdatesTool.php` |
| `list-todos` | `ListTodosTool.php` |
| `create-todo` | `CreateTodoTool.php` |
| `complete-todo` | `CompleteTodoTool.php` |
| `start-timer` | `StartTimerTool.php` |
| `stop-timer` | `StopTimerTool.php` |

### Resources (6)
| Resource | URI |
|----------|-----|
| Dashboard | `lsm://dashboard` |
| Projects | `lsm://projects` |
| My Todos | `lsm://todos/mine` |
| Time Today | `lsm://time/today` |
| Vault | `lsm://vault` |
| Sites At Risk | `lsm://sites/at-risk` |

### Prompts (2)
- `morning-briefing`
- `weekly-status`

### Routes
- `POST /mcp` — Web endpoint with Sanctum auth
- `lsm` — Local handle for CLI

### Tests
- `tests/Feature/Mcp/LsmServerTest.php` — 4 tests, all passing

### Quick Start
```bash
# Test with inspector
php artisan mcp:inspector lsm

# Or start server directly
php artisan mcp:start lsm
```
