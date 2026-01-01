<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Credential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    /**
     * Export projects to CSV.
     */
    public function exportProjects(Request $request): StreamedResponse
    {
        Gate::authorize('viewAny', Project::class);
        
        $user = $request->user();
        $query = Project::with(['manager:id,name', 'developer:id,name']);

        // Filter based on user role
        if (!$user->isAdmin()) {
            if ($user->isManager()) {
                $query->where('manager_id', $user->id);
            } else {
                $query->where('developer_id', $user->id);
            }
        }

        $projects = $query->orderBy('name')->get();

        return $this->streamCsv('projects.csv', function() use ($projects) {
            $header = [
                'ID',
                'External ID',
                'Name',
                'URL',
                'Domain',
                'Client Email',
                'Manager',
                'Developer',
                'Health Status',
                'Security Status',
                'Active',
                'Created At',
                'Updated At',
            ];
            yield $header;

            foreach ($projects as $project) {
                yield [
                    $project->id,
                    $project->project_external_id,
                    $project->name,
                    $project->url,
                    $project->domain,
                    $project->client_email,
                    $project->manager?->name,
                    $project->developer?->name,
                    $project->health_status,
                    $project->security_status,
                    $project->is_active ? 'Yes' : 'No',
                    $project->created_at?->format('Y-m-d H:i:s'),
                    $project->updated_at?->format('Y-m-d H:i:s'),
                ];
            }
        });
    }

    /**
     * Export credentials to CSV (no passwords included).
     */
    public function exportCredentials(Request $request): StreamedResponse
    {
        $user = $request->user();
        $query = Credential::with('project:id,name');

        // Filter based on user role
        if (!$user->isAdmin()) {
            $accessibleProjectIds = $this->getAccessibleProjectIds($user);
            $query->whereIn('project_id', $accessibleProjectIds);
        }

        $credentials = $query->orderBy('created_at', 'desc')->get();

        return $this->streamCsv('credentials.csv', function() use ($credentials) {
            $header = [
                'ID',
                'Project',
                'Title',
                'Type',
                'Username',
                'URL',
                'Created At',
            ];
            yield $header;

            foreach ($credentials as $credential) {
                yield [
                    $credential->id,
                    $credential->project?->name,
                    $credential->title,
                    $credential->type,
                    '***hidden***', // Never export actual usernames
                    $credential->url,
                    $credential->created_at?->format('Y-m-d H:i:s'),
                ];
            }
        });
    }

    /**
     * Export a single project's data (credentials, todos, resources).
     */
    public function exportProject(Request $request, Project $project): StreamedResponse
    {
        Gate::authorize('view', $project);

        $project->load(['credentials', 'todos', 'resources', 'manager:id,name', 'developer:id,name']);

        return $this->streamCsv("project-{$project->project_external_id}.csv", function() use ($project) {
            // Project Info Section
            yield ['# PROJECT INFO'];
            yield ['Name', $project->name];
            yield ['External ID', $project->project_external_id];
            yield ['URL', $project->url];
            yield ['Manager', $project->manager?->name];
            yield ['Developer', $project->developer?->name];
            yield ['Health Status', $project->health_status];
            yield ['Security Status', $project->security_status];
            yield [];

            // Credentials Section
            yield ['# CREDENTIALS'];
            yield ['Title', 'Type', 'URL'];
            foreach ($project->credentials as $credential) {
                yield [
                    $credential->title,
                    $credential->type,
                    $credential->url,
                ];
            }
            yield [];

            // Todos Section
            yield ['# TODOS'];
            yield ['Title', 'Status', 'Priority', 'Due Date', 'Description'];
            foreach ($project->todos as $todo) {
                $priority = match($todo->priority) {
                    2 => 'High',
                    1 => 'Medium',
                    default => 'Low',
                };
                yield [
                    $todo->title,
                    $todo->status ?? 'pending',
                    $priority,
                    $todo->due_date?->format('Y-m-d'),
                    $todo->description,
                ];
            }
            yield [];

            // Resources Section
            yield ['# RESOURCES'];
            yield ['Title', 'Type', 'URL'];
            foreach ($project->resources as $resource) {
                yield [
                    $resource->title,
                    $resource->type,
                    $resource->url,
                ];
            }
        });
    }

    /**
     * Stream a CSV response.
     */
    private function streamCsv(string $filename, callable $generator): StreamedResponse
    {
        return response()->streamDownload(function() use ($generator) {
            $handle = fopen('php://output', 'w');
            
            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            foreach ($generator() as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Get accessible project IDs for the user.
     */
    private function getAccessibleProjectIds($user): array
    {
        if ($user->isAdmin()) {
            return Project::pluck('id')->toArray();
        }

        $projectIds = [];

        if ($user->isManager()) {
            $projectIds = array_merge($projectIds, $user->managedProjects()->pluck('id')->toArray());
        }

        $projectIds = array_merge($projectIds, $user->developedProjects()->pluck('id')->toArray());

        return array_unique($projectIds);
    }
}
