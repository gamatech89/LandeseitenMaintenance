<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Todo extends Model
{
    protected $fillable = [
        'project_id',
        'title',
        'description',
        'completed',
        'priority',
        'due_date',
    ];

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
            'due_date' => 'date',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
