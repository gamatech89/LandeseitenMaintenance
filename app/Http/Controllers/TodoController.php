<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Todo;
use Illuminate\Http\Request;

class TodoController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('create', Todo::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|integer|in:0,1,2',
            'due_date' => 'nullable|date',
        ]);

        $project->todos()->create($validated);

        return back()->with('success', 'Todo added successfully!');
    }

    public function update(Request $request, Project $project, Todo $todo)
    {
        // Verify todo belongs to project
        if ($todo->project_id !== $project->id) {
            abort(404);
        }

        $this->authorize('update', $todo);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'sometimes|boolean',
            'priority' => 'nullable|integer|in:0,1,2',
            'due_date' => 'nullable|date',
        ]);

        $todo->update($validated);

        return back()->with('success', 'Todo updated successfully!');
    }

    public function destroy(Project $project, Todo $todo)
    {
        // Verify todo belongs to project
        if ($todo->project_id !== $project->id) {
            abort(404);
        }

        $this->authorize('delete', $todo);

        $todo->delete();

        return back()->with('success', 'Todo deleted successfully!');
    }
}
