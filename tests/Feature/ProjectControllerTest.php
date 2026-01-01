<?php

use App\Models\User;
use App\Models\Project;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->manager = User::factory()->create(['role' => 'manager']);
    $this->developer = User::factory()->create(['role' => 'developer']);
    $this->viewer = User::factory()->create(['role' => 'viewer']);
});

test('admin can view all projects', function () {
    $response = $this->actingAs($this->admin)->get('/projects');

    $response->assertStatus(200);
});

test('manager can view all projects', function () {
    $response = $this->actingAs($this->manager)->get('/projects');

    $response->assertStatus(200);
});

test('developer can view all projects', function () {
    $response = $this->actingAs($this->developer)->get('/projects');

    $response->assertStatus(200);
});

test('viewer can view all projects', function () {
    $response = $this->actingAs($this->viewer)->get('/projects');

    $response->assertStatus(200);
});

test('admin can create project', function () {
    $response = $this->actingAs($this->admin)->post('/projects', [
        'name' => 'Test Project',
        'url' => 'https://test.com',
        'health_status' => 'online',
        'security_status' => 'secure',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('projects', ['name' => 'Test Project']);
});

test('manager can create project', function () {
    $response = $this->actingAs($this->manager)->post('/projects', [
        'name' => 'Manager Project',
        'url' => 'https://manager-test.com',
        'health_status' => 'online',
        'security_status' => 'secure',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('projects', ['name' => 'Manager Project']);
});

test('developer cannot create project', function () {
    $response = $this->actingAs($this->developer)->post('/projects', [
        'name' => 'Developer Project',
        'url' => 'https://dev-test.com',
        'health_status' => 'online',
        'security_status' => 'secure',
    ]);

    $response->assertStatus(403);
});

test('viewer cannot create project', function () {
    $response = $this->actingAs($this->viewer)->post('/projects', [
        'name' => 'Viewer Project',
        'url' => 'https://viewer-test.com',
        'health_status' => 'online',
        'security_status' => 'secure',
    ]);

    $response->assertStatus(403);
});

test('admin can update any project', function () {
    $project = Project::factory()->create();

    $response = $this->actingAs($this->admin)->put("/projects/{$project->id}", [
        'name' => 'Updated Project',
        'url' => 'https://updated.com',
        'health_status' => 'online',
        'security_status' => 'secure',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('projects', ['name' => 'Updated Project']);
});

test('manager can update their own project', function () {
    $project = Project::factory()->create(['manager_id' => $this->manager->id]);

    $response = $this->actingAs($this->manager)->put("/projects/{$project->id}", [
        'name' => 'Manager Updated',
        'url' => 'https://manager-updated.com',
        'health_status' => 'online',
        'security_status' => 'secure',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('projects', ['name' => 'Manager Updated']);
});

test('manager cannot update other managers project', function () {
    $otherManager = User::factory()->create(['role' => 'manager']);
    $project = Project::factory()->create(['manager_id' => $otherManager->id]);

    $response = $this->actingAs($this->manager)->put("/projects/{$project->id}", [
        'name' => 'Hacked Project',
        'url' => 'https://hacked.com',
        'health_status' => 'online',
        'security_status' => 'secure',
    ]);

    $response->assertStatus(403);
});

test('developer can update their assigned project', function () {
    $project = Project::factory()->create(['developer_id' => $this->developer->id]);

    $response = $this->actingAs($this->developer)->put("/projects/{$project->id}", [
        'name' => 'Developer Updated',
        'url' => 'https://dev-updated.com',
        'health_status' => 'online',
        'security_status' => 'secure',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('projects', ['name' => 'Developer Updated']);
});

test('admin can delete any project', function () {
    $project = Project::factory()->create();

    $response = $this->actingAs($this->admin)->delete("/projects/{$project->id}");

    $response->assertRedirect();
    $this->assertSoftDeleted('projects', ['id' => $project->id]);
});

test('manager can delete their own project', function () {
    $project = Project::factory()->create(['manager_id' => $this->manager->id]);

    $response = $this->actingAs($this->manager)->delete("/projects/{$project->id}");

    $response->assertRedirect();
    $this->assertSoftDeleted('projects', ['id' => $project->id]);
});

test('developer cannot delete project', function () {
    $project = Project::factory()->create(['developer_id' => $this->developer->id]);

    $response = $this->actingAs($this->developer)->delete("/projects/{$project->id}");

    $response->assertStatus(403);
});
