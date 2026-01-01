<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Credential;
use App\Models\Todo;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SearchController extends Controller
{
    /**
     * Global search across all entities.
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $results = collect();

        // Search projects
        $projects = Project::where('name', 'like', "%{$query}%")
            ->orWhere('url', 'like', "%{$query}%")
            ->orWhere('project_external_id', 'like', "%{$query}%")
            ->limit(5)
            ->get();

        foreach ($projects as $project) {
            $results->push([
                'type' => 'project',
                'id' => $project->id,
                'title' => $project->name,
                'subtitle' => $project->project_external_id ?? $project->url,
                'url' => route('projects.show', $project),
            ]);
        }

        // Search credentials (by title only, not sensitive data)
        $credentials = Credential::with('project:id,name')
            ->where('title', 'like', "%{$query}%")
            ->limit(5)
            ->get();

        foreach ($credentials as $credential) {
            $results->push([
                'type' => 'credential',
                'id' => $credential->id,
                'title' => $credential->title,
                'subtitle' => $credential->project?->name ?? 'Unknown Project',
                'url' => route('projects.show', $credential->project_id),
            ]);
        }

        // Search todos
        $todos = Todo::with('project:id,name')
            ->where('title', 'like', "%{$query}%")
            ->orWhere('description', 'like', "%{$query}%")
            ->limit(5)
            ->get();

        foreach ($todos as $todo) {
            $results->push([
                'type' => 'todo',
                'id' => $todo->id,
                'title' => $todo->title,
                'subtitle' => $todo->project?->name ?? 'Unknown Project',
                'url' => route('projects.show', $todo->project_id),
            ]);
        }

        // Search users (admin/manager only)
        $user = $request->user();
        if ($user && in_array($user->role, ['admin', 'manager'])) {
            $users = User::where('name', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%")
                ->limit(3)
                ->get();

            foreach ($users as $foundUser) {
                $results->push([
                    'type' => 'user',
                    'id' => $foundUser->id,
                    'title' => $foundUser->name,
                    'subtitle' => $foundUser->email,
                    'url' => route('team.index', ['search' => $foundUser->name]),
                ]);
            }
        }

        return response()->json([
            'results' => $results->take(15)->values(),
        ]);
    }
}
