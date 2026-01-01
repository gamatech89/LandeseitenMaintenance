<?php

use App\Models\User;
use App\Models\Project;
use App\Models\Credential;

beforeEach(function () {
    $this->admin = User::factory()->create(['role' => 'admin']);
    $this->manager = User::factory()->create(['role' => 'manager']);
    $this->developer = User::factory()->create(['role' => 'developer']);
    $this->viewer = User::factory()->create(['role' => 'viewer']);
});

test('admin can view vault', function () {
    $response = $this->actingAs($this->admin)->get('/vault');

    $response->assertStatus(200);
});

test('all roles can view vault', function () {
    foreach ([$this->manager, $this->developer, $this->viewer] as $user) {
        $response = $this->actingAs($user)->get('/vault');
        $response->assertStatus(200);
    }
});

test('admin can create credential for any project', function () {
    $project = Project::factory()->create();

    $response = $this->actingAs($this->admin)->post("/projects/{$project->id}/credentials", [
        'title' => 'Admin Credential',
        'type' => 'hosting',
        'username' => 'admin',
        'password' => 'secret123',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('credentials', ['title' => 'Admin Credential']);
});

test('manager can create credential for their project', function () {
    $project = Project::factory()->create(['manager_id' => $this->manager->id]);

    $response = $this->actingAs($this->manager)->post("/projects/{$project->id}/credentials", [
        'title' => 'Manager Credential',
        'type' => 'wordpress',
        'username' => 'manager',
        'password' => 'secret123',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('credentials', ['title' => 'Manager Credential']);
});

test('developer can create credential for their assigned project', function () {
    $project = Project::factory()->create(['developer_id' => $this->developer->id]);

    $response = $this->actingAs($this->developer)->post("/projects/{$project->id}/credentials", [
        'title' => 'Developer Credential',
        'type' => 'ssh',
        'username' => 'developer',
        'password' => 'secret123',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('credentials', ['title' => 'Developer Credential']);
});

test('viewer cannot create credentials', function () {
    $project = Project::factory()->create();

    $response = $this->actingAs($this->viewer)->post("/projects/{$project->id}/credentials", [
        'title' => 'Viewer Credential',
        'type' => 'hosting',
        'username' => 'viewer',
        'password' => 'secret123',
    ]);

    $response->assertStatus(403);
});

test('manager cannot create credential for other managers project', function () {
    $otherManager = User::factory()->create(['role' => 'manager']);
    $project = Project::factory()->create(['manager_id' => $otherManager->id]);

    $response = $this->actingAs($this->manager)->post("/projects/{$project->id}/credentials", [
        'title' => 'Unauthorized Credential',
        'type' => 'hosting',
        'username' => 'hacker',
        'password' => 'secret123',
    ]);

    $response->assertStatus(403);
});

test('credential password is encrypted in database', function () {
    $project = Project::factory()->create();
    
    $credential = Credential::create([
        'project_id' => $project->id,
        'title' => 'Test Credential',
        'type' => 'hosting',
        'username' => 'testuser',
        'password' => 'plaintext_password',
    ]);

    // Get raw database value
    $rawCredential = \DB::table('credentials')->where('id', $credential->id)->first();
    
    // Password should be encrypted (not plaintext)
    expect($rawCredential->password)->not->toBe('plaintext_password');
    
    // But when accessed via model, it should be decrypted
    $credential->refresh();
    expect($credential->password)->toBe('plaintext_password');
});

test('credential username is encrypted in database', function () {
    $project = Project::factory()->create();
    
    $credential = Credential::create([
        'project_id' => $project->id,
        'title' => 'Test Credential',
        'type' => 'hosting',
        'username' => 'secret_username',
        'password' => 'secret_password',
    ]);

    // Get raw database value
    $rawCredential = \DB::table('credentials')->where('id', $credential->id)->first();
    
    // Username should be encrypted (not plaintext)
    expect($rawCredential->username)->not->toBe('secret_username');
    
    // But when accessed via model, it should be decrypted
    $credential->refresh();
    expect($credential->username)->toBe('secret_username');
});
