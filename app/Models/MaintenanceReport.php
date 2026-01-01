<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceReport extends Model
{
    protected $fillable = [
        'project_id',
        'user_id',
        'report_date',
        'type',
        'summary',
        'tasks_completed',
        'updates_performed',
        'issues_found',
        'issues_resolved',
        'notes',
        'time_spent_minutes',
    ];

    protected $casts = [
        'report_date' => 'date',
        'tasks_completed' => 'array',
        'updates_performed' => 'array',
        'issues_found' => 'array',
        'issues_resolved' => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Format time spent as human readable string
     */
    public function getTimeSpentFormattedAttribute(): ?string
    {
        if (!$this->time_spent_minutes) {
            return null;
        }

        $hours = floor($this->time_spent_minutes / 60);
        $minutes = $this->time_spent_minutes % 60;

        if ($hours > 0) {
            return $minutes > 0 ? "{$hours}h {$minutes}m" : "{$hours}h";
        }

        return "{$minutes}m";
    }
}
