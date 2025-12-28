<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Project::query();

        // Filter by health status
        if ($request->has('health') && $request->health !== 'all') {
            $query->where('health_status', $request->health);
        }

        // Filter by security status
        if ($request->has('security') && $request->security !== 'all') {
            $query->where('security_status', $request->security);
        }

        // Search
        if ($request->has('search') && $request->search) {
            $searchTerm = '%'.$request->search.'%';
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', $searchTerm)
                    ->orWhere('url', 'like', $searchTerm)
                    ->orWhere('client_email', 'like', $searchTerm);
            });
        }

        $projects = $query->orderBy('updated_at', 'desc')->paginate(15);

        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'filters' => $request->only(['health', 'security', 'search']),
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project): Response
    {
        $project->load(['credentials', 'resources', 'todos']);

        return Inertia::render('Projects/Show', [
            'project' => $project,
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
        //
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
        $this->authorize('update', $project);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url',
            'client_email' => 'nullable|email',
            'notes' => 'nullable|string',
            'health_status' => 'required|in:online,down_error,updating',
            'security_status' => 'required|in:secure,monitoring,compromised,hacked',
        ]);

        // Sanitize notes to prevent XSS
        if (isset($validated['notes'])) {
            $validated['notes'] = strip_tags($validated['notes']);
        }

        $project->update($validated);

        return back()->with('success', 'Project updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project)
    {
        $this->authorize('delete', $project);

        $project->delete();

        return redirect()->route('projects.index')
            ->with('success', 'Project deleted successfully!');
    }
}
