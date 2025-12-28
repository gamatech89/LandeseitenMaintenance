<?php

namespace App\Policies;

use App\Models\Todo;
use App\Models\User;

class TodoPolicy
{
    /**
     * Determine if the user can view the todo.
     */
    public function view(User $user, Todo $todo): bool
    {
        // All authenticated users can view todos
        return true;
    }

    /**
     * Determine if the user can create todos.
     */
    public function create(User $user): bool
    {
        // Only admins and managers can create todos
        return in_array($user->role, ['admin', 'manager']);
    }

    /**
     * Determine if the user can update the todo.
     */
    public function update(User $user, Todo $todo): bool
    {
        // Only admins and managers can update todos
        return in_array($user->role, ['admin', 'manager']);
    }

    /**
     * Determine if the user can delete the todo.
     */
    public function delete(User $user, Todo $todo): bool
    {
        // Only admins and managers can delete todos
        return in_array($user->role, ['admin', 'manager']);
    }
}
