<?php

namespace App\Models;

use App\Http\Controllers\DashboardController;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Project extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'name',
        'url',
        'domain',
        'client_email',
        'notes',
        'health_status',
        'security_status',
        'is_active',
        'manager_id',
        'developer_id',
        'project_external_id',
        'maintenance_id',
        'hosting_provider',
        'hosting_url',
        'ssh_access',
        'drive_link',
        'trello_link',
        // Health monitoring fields
        'response_time_ms',
        'last_health_check_at',
        'ssl_status',
        'ssl_expires_at',
        'wp_version',
        'php_version',
        'outdated_plugins_count',
        'health_check_secret',
        'last_health_details',
    ];

    protected function casts(): array
    {
        return [
            'last_health_check_at' => 'datetime',
            'ssl_expires_at' => 'date',
            'last_health_details' => 'array',
        ];
    }

    /**
     * Clear dashboard cache when project status changes.
     */
    protected static function booted(): void
    {
        static::saved(function (Project $project) {
            if ($project->isDirty(['health_status', 'security_status'])) {
                DashboardController::clearCache();
            }
        });

        static::deleting(function (Project $project) {
            // Cascade delete related records
            $project->credentials()->delete();
            $project->resources()->delete();
            $project->todos()->delete();
            $project->tags()->detach();
            $project->developers()->detach();
        });

        static::deleted(function () {
            DashboardController::clearCache();
        });
    }

    /**
     * Configure activity logging options.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'url', 'health_status', 'security_status', 'manager_id', 'developer_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "Project has been {$eventName}");
    }

    /**
     * Get the manager of the project.
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Get the developer assigned to the project (legacy single developer).
     */
    public function developer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'developer_id');
    }

    /**
     * Get all developers assigned to the project.
     */
    public function developers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_developer')
            ->withTimestamps();
    }

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

    /**
     * Get the tags for the project.
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    /**
     * Generate a unique external ID in format LP + 5 digits.
     */
    public static function generateExternalId(): string
    {
        $lastProject = static::orderBy('id', 'desc')->first();
        
        if ($lastProject && $lastProject->project_external_id) {
            // Extract the number from the last external ID
            $lastNumber = (int) substr($lastProject->project_external_id, 2);
            $newNumber = $lastNumber + 1;
        } else {
            // Start from 10001 if no projects exist
            $newNumber = 10001;
        }

        return 'LP' . str_pad($newNumber, 5, '0', STR_PAD_LEFT);
    }
}
