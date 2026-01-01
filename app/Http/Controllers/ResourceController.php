<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class ResourceController extends Controller
{
    /**
     * Store a newly created resource.
     */
    public function store(Request $request, Project $project)
    {
        Gate::authorize('create', [Resource::class, $project]);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:file,link',
            'url' => 'nullable|url|required_if:type,link',
            'file' => 'nullable|file|max:10240|required_if:type,file', // 10MB max
            'notes' => 'nullable|string',
        ]);

        $data = [
            'title' => $validated['title'],
            'type' => $validated['type'],
            'notes' => $validated['notes'] ?? null,
        ];

        if ($validated['type'] === 'file' && $request->hasFile('file')) {
            $file = $request->file('file');
            $path = $file->store("resources/{$project->id}", 'private');
            $data['file_path'] = $path;
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_size'] = $file->getSize();
            $data['mime_type'] = $file->getMimeType();
        } elseif ($validated['type'] === 'link') {
            $data['url'] = $validated['url'];
        }

        $project->resources()->create($data);

        return redirect()->route('projects.show', $project)
            ->with('success', 'Resource added successfully.');
    }

    /**
     * Update the specified resource.
     */
    public function update(Request $request, Project $project, Resource $resource)
    {
        Gate::authorize('update', $resource);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|in:file,link',
            'url' => 'nullable|url|required_if:type,link',
            'file' => 'nullable|file|max:10240', // Optional file replacement
            'notes' => 'nullable|string',
        ]);

        $data = [
            'title' => $validated['title'],
            'type' => $validated['type'],
            'notes' => $validated['notes'] ?? null,
        ];

        // Handle file upload on update
        if ($request->hasFile('file')) {
            // Delete old file if exists
            if ($resource->file_path) {
                Storage::disk('private')->delete($resource->file_path);
            }

            $file = $request->file('file');
            $path = $file->store("resources/{$project->id}", 'private');
            $data['file_path'] = $path;
            $data['file_name'] = $file->getClientOriginalName();
            $data['file_size'] = $file->getSize();
            $data['mime_type'] = $file->getMimeType();
            $data['url'] = null;
        } elseif ($validated['type'] === 'link') {
            // Clear file data if switching to link
            if ($resource->file_path) {
                Storage::disk('private')->delete($resource->file_path);
            }
            $data['url'] = $validated['url'];
            $data['file_path'] = null;
            $data['file_name'] = null;
            $data['file_size'] = null;
            $data['mime_type'] = null;
        }

        $resource->update($data);

        return redirect()->route('projects.show', $project)
            ->with('success', 'Resource updated successfully.');
    }

    /**
     * Remove the specified resource.
     */
    public function destroy(Project $project, Resource $resource)
    {
        Gate::authorize('delete', $resource);

        // Delete file if exists
        if ($resource->file_path) {
            Storage::disk('private')->delete($resource->file_path);
        }

        $resource->delete();

        return redirect()->route('projects.show', $project)
            ->with('success', 'Resource deleted successfully.');
    }

    /**
     * Download a file resource.
     */
    public function download(Project $project, Resource $resource)
    {
        Gate::authorize('download', $resource);

        if (!$resource->file_path) {
            abort(404, 'File not found');
        }

        $path = storage_path('app/private/' . $resource->file_path);
        
        if (!file_exists($path)) {
            abort(404, 'File not found');
        }

        return response()->download($path, $resource->file_name);
    }
}
