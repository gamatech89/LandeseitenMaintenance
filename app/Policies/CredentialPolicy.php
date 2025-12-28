<?php

namespace App\Policies;

use App\Models\Credential;
use App\Models\User;

class CredentialPolicy
{
    /**
     * Determine if the user can view the credential.
     */
    public function view(User $user, Credential $credential): bool
    {
        // All authenticated users can view credentials
        return true;
    }

    /**
     * Determine if the user can create credentials.
     */
    public function create(User $user): bool
    {
        // Only admins and managers can create credentials
        return in_array($user->role, ['admin', 'manager']);
    }

    /**
     * Determine if the user can update the credential.
     */
    public function update(User $user, Credential $credential): bool
    {
        // Only admins and managers can update credentials
        return in_array($user->role, ['admin', 'manager']);
    }

    /**
     * Determine if the user can delete the credential.
     */
    public function delete(User $user, Credential $credential): bool
    {
        // Only admins and managers can delete credentials
        return in_array($user->role, ['admin', 'manager']);
    }
}
