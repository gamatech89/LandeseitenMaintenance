<?php

namespace App\Providers;

use App\Models\Credential;
use App\Models\Project;
use App\Models\Todo;
use App\Policies\CredentialPolicy;
use App\Policies\ProjectPolicy;
use App\Policies\TodoPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Register policies
        Gate::policy(Project::class, ProjectPolicy::class);
        Gate::policy(Credential::class, CredentialPolicy::class);
        Gate::policy(Todo::class, TodoPolicy::class);
    }
}
