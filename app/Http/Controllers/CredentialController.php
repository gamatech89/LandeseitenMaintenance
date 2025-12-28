<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Credential;
use Illuminate\Http\Request;

class CredentialController extends Controller
{
    public function store(Request $request, Project $project)
    {
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
        $credential->delete();

        return back()->with('success', 'Credential deleted successfully!');
    }
}
