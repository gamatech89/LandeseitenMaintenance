<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'name',
        'url',
        'client_email',
        'notes',
        'health_status',
        'security_status',
    ];

    /**
     * Get the credentials for the project.
     */
    public function credentials(): HasMany
    {
        return $this->hasMany(Credential::class);
    }

    /**
     * Get the resources for the project.
     */
    public function resources(): HasMany
    {
        return $this->hasMany(Resource::class);
    }

    /**
     * Get the todos for the project.
     */
    public function todos(): HasMany
    {
        return $this->hasMany(Todo::class);
    }
}
