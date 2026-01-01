<?php

use App\Models\Project;
use App\Models\Todo;
use App\Models\User;

beforeEach(function () {
    // Create users with different roles
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->manager = User::factory()->create(['role' => 'manager']);
    $this->otherManager = User::factory()->create(['role' => 'manager']);
    $this->developer = User::factory()->create(['role' => 'developer']);
    $this->viewer = User::factory()->create(['role' => 'viewer']);
    
    // Create a project assigned to manager and developer
    $this->project = Project::factory()->create([
        'manager_id' => $this->manager->id,
        'developer_id' => $this->developer->id,
    ]);
    
    // Create a todo for the project
    $this->todo = Todo::create([
        'project_id' => $this->project->id,
        'title' => 'Test Todo',
        'completed' => false,
    ]);
});

test('admin can create todos for any project', function () {
    $response = $this->actingAs($this->admin)->post(
        route('todos.store', $this->project),
        ['title' => 'Admin Todo']
    );
    
    $response->assertRedirect();
    $this->assertDatabaseHas('todos', ['title' => 'Admin Todo']);
});

test('manager can create todos for their project', function () {
    $response = $this->actingAs($this->manager)->post(
        route('todos.store', $this->project),
        ['title' => 'Manager Todo']
    );
    
    $response->assertRedirect();
    $this->assertDatabaseHas('todos', ['title' => 'Manager Todo']);
});

test('manager cannot create todos for other manager project', function () {
    $otherProject = Project::factory()->create([
        'manager_id' => $this->otherManager->id,
    ]);
    
    $response = $this->actingAs($this->manager)->post(
        route('todos.store', $otherProject),
        ['title' => 'Unauthorized Todo']
    );
    
    $response->assertForbidden();
});

test('developer can create todos for their assigned project', function () {
    $response = $this->actingAs($this->developer)->post(
        route('todos.store', $this->project),
        ['title' => 'Developer Todo']
    );
    
    $response->assertRedirect();
    $this->assertDatabaseHas('todos', ['title' => 'Developer Todo']);
});

test('viewer cannot create todos', function () {
    $response = $this->actingAs($this->viewer)->post(
        route('todos.store', $this->project),
        ['title' => 'Viewer Todo']
    );
    
    $response->assertForbidden();
});

test('manager can update todos on their project', function () {
    $response = $this->actingAs($this->manager)->put(
        route('todos.update', [$this->project, $this->todo]),
        ['completed' => true]
    );
    
    $response->assertRedirect();
    $this->todo->refresh();
    expect($this->todo->status)->toBe('completed');
});

test('developer can update todos on their assigned project', function () {
    $response = $this->actingAs($this->developer)->put(
        route('todos.update', [$this->project, $this->todo]),
        ['completed' => true]
    );
    
    $response->assertRedirect();
});

test('viewer cannot update todos', function () {
    $response = $this->actingAs($this->viewer)->put(
        route('todos.update', [$this->project, $this->todo]),
        ['completed' => true]
    );
    
    $response->assertForbidden();
});

test('manager can delete todos on their project', function () {
    $response = $this->actingAs($this->manager)->delete(
        route('todos.destroy', [$this->project, $this->todo])
    );
    
    $response->assertRedirect();
    $this->assertSoftDeleted('todos', ['id' => $this->todo->id]);
});

test('developer cannot delete todos', function () {
    $response = $this->actingAs($this->developer)->delete(
        route('todos.destroy', [$this->project, $this->todo])
    );
    
    $response->assertForbidden();
});

test('viewer cannot delete todos', function () {
    $response = $this->actingAs($this->viewer)->delete(
        route('todos.destroy', [$this->project, $this->todo])
    );
    
    $response->assertForbidden();
});
