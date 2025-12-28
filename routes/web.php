<?php

use App\Http\Controllers\CredentialController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TodoController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Projects
    Route::resource('projects', ProjectController::class);

    // Credentials (nested under projects)
    Route::post('/projects/{project}/credentials', [CredentialController::class, 'store'])->name('credentials.store');
    Route::put('/projects/{project}/credentials/{credential}', [CredentialController::class, 'update'])->name('credentials.update');
    Route::delete('/projects/{project}/credentials/{credential}', [CredentialController::class, 'destroy'])->name('credentials.destroy');

    // Todos (nested under projects)
    Route::post('/projects/{project}/todos', [TodoController::class, 'store'])->name('todos.store');
    Route::put('/projects/{project}/todos/{todo}', [TodoController::class, 'update'])->name('todos.update');
    Route::delete('/projects/{project}/todos/{todo}', [TodoController::class, 'destroy'])->name('todos.destroy');

    // Placeholder routes for Vault and Team
    Route::get('/vault', fn () => Inertia::render('Vault/Index'))->name('vault.index');
    Route::get('/team', fn () => Inertia::render('Team/Index'))->name('team.index');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
