<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;

class TeamController extends Controller
{
    /**
     * Display a listing of the team members.
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->withCount(['managedProjects', 'assignedProjects'])
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Team/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
            'allProjects' => Project::select('id', 'name', 'manager_id')
                ->orderBy('name')
                ->get(),
        ]);
    }

    /**
     * Store a newly created team member.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:admin,manager,developer,viewer',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
        ]);

        return redirect()->route('team.index')
            ->with('success', 'Team member created successfully.');
    }

    /**
     * Update the specified team member.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'role' => 'required|in:admin,manager,developer,viewer',
            'password' => ['nullable', 'confirmed', Rules\Password::defaults()],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        return redirect()->route('team.index')
            ->with('success', 'Team member updated successfully.');
    }

    /**
     * Remove the specified team member.
     */
    public function destroy(User $user)
    {
        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return redirect()->route('team.index')
                ->with('error', 'You cannot delete your own account.');
        }

        // Unassign from any managed projects
        $user->managedProjects()->update(['manager_id' => null]);
        
        // Detach from any assigned projects (many-to-many)
        $user->assignedProjects()->detach();

        $user->delete();

        return redirect()->route('team.index')
            ->with('success', 'Team member deleted successfully.');
    }

    /**
     * Get projects managed by a user (for PMs).
     */
    public function getProjects(User $user)
    {
        return response()->json([
            'managed_project_ids' => $user->managedProjects()->pluck('id'),
        ]);
    }

    /**
     * Get projects assigned to a developer (many-to-many).
     */
    public function getDeveloperProjects(User $user)
    {
        return response()->json([
            'assigned_project_ids' => $user->assignedProjects()->pluck('projects.id'),
        ]);
    }

    /**
     * Bulk update project assignments for a manager (PM).
     */
    public function updateProjects(Request $request, User $user)
    {
        $validated = $request->validate([
            'project_ids' => 'array',
            'project_ids.*' => 'exists:projects,id',
        ]);

        $newProjectIds = $validated['project_ids'] ?? [];
        $currentProjectIds = $user->managedProjects()->pluck('id')->toArray();

        // Projects to unassign (were assigned, now not in list)
        $toUnassign = array_diff($currentProjectIds, $newProjectIds);
        
        // Projects to assign (not assigned, now in list)
        $toAssign = array_diff($newProjectIds, $currentProjectIds);

        // Unassign projects
        if (!empty($toUnassign)) {
            Project::whereIn('id', $toUnassign)
                ->where('manager_id', $user->id)
                ->update(['manager_id' => null]);
        }

        // Assign new projects
        if (!empty($toAssign)) {
            Project::whereIn('id', $toAssign)
                ->update(['manager_id' => $user->id]);
        }

        return redirect()->route('team.index')
            ->with('success', 'Project assignments updated successfully.');
    }

    /**
     * Bulk update project assignments for a developer (many-to-many).
     */
    public function updateDeveloperProjects(Request $request, User $user)
    {
        $validated = $request->validate([
            'project_ids' => 'array',
            'project_ids.*' => 'exists:projects,id',
        ]);

        $newProjectIds = $validated['project_ids'] ?? [];

        // Sync the many-to-many relationship
        $user->assignedProjects()->sync($newProjectIds);

        return redirect()->route('team.index')
            ->with('success', 'Developer project assignments updated successfully.');
    }
}
