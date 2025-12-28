<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Resource extends Model
{
    protected $fillable = [
        'project_id',
        'title',
        'type',
        'url',
        'file_path',
    ];

    /**
     * Get the project that owns the resource.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
