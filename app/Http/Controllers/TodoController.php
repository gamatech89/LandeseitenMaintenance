<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Todo;
use App\Models\User;
use App\Notifications\TodoAddedNotification;
use App\Notifications\TodoAssignedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class TodoController extends Controller
{
    public function store(Request $request, Project $project)
    {
        Gate::authorize('create', [Todo::class, $project]);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'priority' => 'nullable|string|in:low,medium,high,critical',
            'due_date' => 'nullable|date',
            'assignee_id' => 'nullable|integer|exists:users,id',
            'file' => 'nullable|file|max:10240', // 10MB max
        ]);

        $data = collect($validated)->except('file')->toArray();

        // Convert empty string to null for assignee_id
        if (array_key_exists('assignee_id', $data) && ($data['assignee_id'] === '' || $data['assignee_id'] === null)) {
            $data['assignee_id'] = null;
        }

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store("todos/{$project->id}", 'private');
            $data['file_path'] = $path;
            $data['file_name'] = $file->getClientOriginalName();
        }

        $todo = $project->todos()->create($data);

        // Notify project team members (manager & all developers) about the new todo
        $currentUser = Auth::user();
        $teamMembers = collect();
        
        if ($project->manager_id && $project->manager_id !== $currentUser->id) {
            $teamMembers->push(User::find($project->manager_id));
        }
        if ($project->developer_id && $project->developer_id !== $currentUser->id) {
            $teamMembers->push(User::find($project->developer_id));
        }
        // Include all developers from the many-to-many relationship
        foreach ($project->developers as $developer) {
            if ($developer->id !== $currentUser->id) {
                $teamMembers->push($developer);
            }
        }
        
        foreach ($teamMembers->filter()->unique('id') as $member) {
            // Don't notify the assignee here - they get a separate notification below
            if ($member->id !== $todo->assignee_id) {
                $member->notify(new TodoAddedNotification($todo, $currentUser->name));
            }
        }

        // Send notification if assignee is set (separate from project team notification)
        if ($todo->assignee_id && $todo->assignee_id !== $currentUser->id) {
            $assignee = User::find($todo->assignee_id);
            $assignee?->notify(new TodoAssignedNotification($todo));
        }

        return back()->with('success', 'Todo added successfully!');
    }

    public function update(Request $request, Project $project, Todo $todo)
    {
        Gate::authorize('update', $todo);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'completed' => 'sometimes|boolean',
            'priority' => 'nullable|string|in:low,medium,high,critical',
            'due_date' => 'nullable|date',
            'assignee_id' => 'nullable|integer|exists:users,id',
            'file' => 'nullable|file|max:10240',
            'remove_file' => 'nullable|boolean',
        ]);

        $oldAssigneeId = $todo->assignee_id;
        $data = collect($validated)->except(['file', 'remove_file', 'completed'])->toArray();

        // Convert empty string to null for assignee_id
        if (array_key_exists('assignee_id', $data) && ($data['assignee_id'] === '' || $data['assignee_id'] === null)) {
            $data['assignee_id'] = null;
        }

        // Convert completed to status
        if (isset($validated['completed'])) {
            $data['status'] = $validated['completed'] ? 'completed' : 'pending';
        }

        // Handle file removal
        if ($request->input('remove_file') && $todo->file_path) {
            Storage::disk('private')->delete($todo->file_path);
            $data['file_path'] = null;
            $data['file_name'] = null;
        }

        // Handle new file upload
        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($todo->file_path) {
                Storage::disk('private')->delete($todo->file_path);
            }
            $file = $request->file('file');
            $path = $file->store("todos/{$project->id}", 'private');
            $data['file_path'] = $path;
            $data['file_name'] = $file->getClientOriginalName();
        }

        $todo->update($data);

        // Send notification if assignee changed
        if (isset($validated['assignee_id']) && $validated['assignee_id'] != $oldAssigneeId && $validated['assignee_id']) {
            $newAssignee = User::find($validated['assignee_id']);
            $newAssignee?->notify(new TodoAssignedNotification($todo));
        }

        return back()->with('success', 'Todo updated successfully!');
    }

    public function destroy(Project $project, Todo $todo)
    {
        Gate::authorize('delete', $todo);

        // Delete attached file if exists
        if ($todo->file_path) {
            Storage::disk('private')->delete($todo->file_path);
        }

        $todo->delete();

        return back()->with('success', 'Todo deleted successfully!');
    }

    public function download(Project $project, Todo $todo)
    {
        Gate::authorize('download', $todo);

        if (!$todo->file_path) {
            abort(404, 'File not found');
        }

        $path = storage_path('app/private/' . $todo->file_path);

        if (!file_exists($path)) {
            abort(404, 'File not found');
        }

        return response()->download($path, $todo->file_name);
    }
}
