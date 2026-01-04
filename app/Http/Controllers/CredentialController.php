<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Credential;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CredentialController extends Controller
{
    public function store(Request $request, Project $project)
    {
        Gate::authorize('manageCredentials', $project);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:ssh,ftp,database,wordpress,hosting,email,api,other',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string',
            'url' => 'nullable|url',
            'metadata' => 'nullable|array',
            'metadata.hostname' => 'nullable|string|max:255',
            'metadata.port' => 'nullable|string|max:10',
            'metadata.host' => 'nullable|string|max:255',
            'metadata.database_name' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:1000',
        ]);

        $project->credentials()->create($validated);

        return back()->with('success', 'Credential added successfully!');
    }

    public function update(Request $request, Project $project, Credential $credential)
    {
        Gate::authorize('update', $credential);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:ssh,ftp,database,wordpress,hosting,email,api,other',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string',
            'url' => 'nullable|url',
            'metadata' => 'nullable|array',
            'metadata.hostname' => 'nullable|string|max:255',
            'metadata.port' => 'nullable|string|max:10',
            'metadata.host' => 'nullable|string|max:255',
            'metadata.database_name' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:1000',
        ]);

        $credential->update($validated);

        return back()->with('success', 'Credential updated successfully!');
    }

    public function destroy(Project $project, Credential $credential)
    {
        Gate::authorize('delete', $credential);

        $credential->delete();

        return back()->with('success', 'Credential deleted successfully!');
    }
}
