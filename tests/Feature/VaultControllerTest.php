<?php

use App\Models\Credential;
use App\Models\Project;
use App\Models\User;
use Spatie\Activitylog\Models\Activity;

beforeEach(function () {
    // Create users with different roles
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->manager = User::factory()->create(['role' => 'manager']);
    $this->otherManager = User::factory()->create(['role' => 'manager']);
    $this->developer = User::factory()->create(['role' => 'developer']);
    $this->viewer = User::factory()->create(['role' => 'viewer']);

    // Create projects with different assignments
    $this->managerProject = Project::factory()->create([
        'manager_id' => $this->manager->id,
        'developer_id' => $this->developer->id,
    ]);

    $this->otherProject = Project::factory()->create([
        'manager_id' => $this->otherManager->id,
        'developer_id' => null,
    ]);

    // Create credentials for each project
    $this->managerProjectCredential = Credential::factory()->create([
        'project_id' => $this->managerProject->id,
        'title' => 'Manager Project Credential',
        'password' => 'secret123',
    ]);

    $this->otherProjectCredential = Credential::factory()->create([
        'project_id' => $this->otherProject->id,
        'title' => 'Other Project Credential',
        'password' => 'othersecret',
    ]);
});

test('admin can see all credentials in vault', function () {
    $response = $this->actingAs($this->admin)->get(route('vault.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => 
        $page->component('Vault/Index')
            ->has('credentials.data', 2)
    );
});

test('manager can only see credentials from their managed projects', function () {
    $response = $this->actingAs($this->manager)->get(route('vault.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => 
        $page->component('Vault/Index')
            ->has('credentials.data', 1)
            ->where('credentials.data.0.title', 'Manager Project Credential')
    );
});

test('developer can only see credentials from assigned projects', function () {
    $response = $this->actingAs($this->developer)->get(route('vault.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => 
        $page->component('Vault/Index')
            ->has('credentials.data', 1)
            ->where('credentials.data.0.title', 'Manager Project Credential')
    );
});

test('viewer with no assigned projects sees no credentials', function () {
    $response = $this->actingAs($this->viewer)->get(route('vault.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => 
        $page->component('Vault/Index')
            ->has('credentials.data', 0)
    );
});

test('manager cannot see credentials from other managers projects', function () {
    $response = $this->actingAs($this->manager)->get(route('vault.index'));

    $response->assertStatus(200);
    
    // Should not contain the other manager's project credential
    $response->assertInertia(fn ($page) => 
        $page->component('Vault/Index')
            ->where('credentials.data', fn ($credentials) => 
                collect($credentials)->pluck('title')->doesntContain('Other Project Credential')
            )
    );
});

test('project filter dropdown only shows accessible projects', function () {
    $response = $this->actingAs($this->manager)->get(route('vault.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => 
        $page->component('Vault/Index')
            ->has('projects', 1) // Only the manager's project should be in dropdown
    );
});

test('admin project filter dropdown shows all projects', function () {
    $response = $this->actingAs($this->admin)->get(route('vault.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => 
        $page->component('Vault/Index')
            ->has('projects', 2)
    );
});

// Password reveal tests
test('manager can reveal password for their project credentials', function () {
    $response = $this->actingAs($this->manager)->get(
        route('vault.reveal', ['credential' => $this->managerProjectCredential->id])
    );

    $response->assertStatus(200);
    $response->assertJson(['password' => 'secret123']);
});

test('manager cannot reveal password for other projects', function () {
    $response = $this->actingAs($this->manager)->get(
        route('vault.reveal', ['credential' => $this->otherProjectCredential->id])
    );

    $response->assertStatus(403);
});

test('admin can reveal any password', function () {
    $response = $this->actingAs($this->admin)->get(
        route('vault.reveal', ['credential' => $this->otherProjectCredential->id])
    );

    $response->assertStatus(200);
    $response->assertJson(['password' => 'othersecret']);
});

test('password reveal is logged in activity log', function () {
    Activity::truncate(); // Clear any previous activity

    $this->actingAs($this->manager)->get(
        route('vault.reveal', ['credential' => $this->managerProjectCredential->id])
    );

    $activity = Activity::where('description', 'password_revealed')->first();
    expect($activity)->not->toBeNull();
    expect($activity->causer_id)->toBe($this->manager->id);
    expect($activity->subject_id)->toBe($this->managerProjectCredential->id);
    expect($activity->properties['credential_title'])->toBe('Manager Project Credential');
});

test('passwords are masked in vault index response', function () {
    $response = $this->actingAs($this->manager)->get(route('vault.index'));

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => 
        $page->component('Vault/Index')
            ->where('credentials.data.0.password', '••••••••')
    );
});
