<?php

namespace App\Http\Controllers;

use App\Models\Credential;
use App\Models\Project;
use Illuminate\Http\Request;

class CredentialController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('create', Credential::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:ssh,ftp,db,wp_admin,api',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string',
            'url' => 'nullable|url',
        ]);

        $project->credentials()->create($validated);

        return back()->with('success', 'Credential added successfully!');
    }

    public function update(Request $request, Project $project, Credential $credential)
    {
        // Verify credential belongs to project
        if ($credential->project_id !== $project->id) {
            abort(404);
        }

        $this->authorize('update', $credential);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:ssh,ftp,db,wp_admin,api',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string',
            'url' => 'nullable|url',
        ]);

        $credential->update($validated);

        return back()->with('success', 'Credential updated successfully!');
    }

    public function destroy(Project $project, Credential $credential)
    {
        // Verify credential belongs to project
        if ($credential->project_id !== $project->id) {
            abort(404);
        }

        $this->authorize('delete', $credential);

        $credential->delete();

        return back()->with('success', 'Credential deleted successfully!');
    }
}
