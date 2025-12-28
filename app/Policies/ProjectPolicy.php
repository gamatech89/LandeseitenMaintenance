<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /**
     * Determine if the user can view any projects.
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view projects
        return true;
    }

    /**
     * Determine if the user can view the project.
     */
    public function view(User $user, Project $project): bool
    {
        // All authenticated users can view individual projects
        return true;
    }

    /**
     * Determine if the user can create projects.
     */
    public function create(User $user): bool
    {
        // Only admins and managers can create projects
        return in_array($user->role, ['admin', 'manager']);
    }

    /**
     * Determine if the user can update the project.
     */
    public function update(User $user, Project $project): bool
    {
        // Only admins and managers can update projects
        return in_array($user->role, ['admin', 'manager']);
    }

    /**
     * Determine if the user can delete the project.
     */
    public function delete(User $user, Project $project): bool
    {
        // Only admins can delete projects
        return $user->role === 'admin';
    }
}
