<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Credential extends Model
{
    protected $fillable = [
        'project_id',
        'title',
        'type',
        'username',
        'password',
        'url',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'password' => 'encrypted',
        ];
    }

    /**
     * Get the project that owns the credential.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
