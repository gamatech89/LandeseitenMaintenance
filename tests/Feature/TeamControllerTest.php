<?php

use App\Models\User;

test('admin can access team management', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get('/team');

    $response->assertStatus(200);
});

test('manager can access team management', function () {
    $manager = User::factory()->create(['role' => 'manager']);

    $response = $this->actingAs($manager)->get('/team');

    $response->assertStatus(200);
});

test('developer cannot access team management', function () {
    $developer = User::factory()->create(['role' => 'developer']);

    $response = $this->actingAs($developer)->get('/team');

    $response->assertStatus(403);
});

test('viewer cannot access team management', function () {
    $viewer = User::factory()->create(['role' => 'viewer']);

    $response = $this->actingAs($viewer)->get('/team');

    $response->assertStatus(403);
});

test('admin can create team member', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post('/team', [
        'name' => 'New Team Member',
        'email' => 'newmember@test.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'developer',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('users', ['email' => 'newmember@test.com']);
});

test('manager cannot create team member', function () {
    $manager = User::factory()->create(['role' => 'manager']);

    $response = $this->actingAs($manager)->post('/team', [
        'name' => 'Unauthorized Member',
        'email' => 'unauthorized@test.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'developer',
    ]);

    $response->assertStatus(403);
});

test('admin can update team member', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $member = User::factory()->create(['role' => 'developer']);

    $response = $this->actingAs($admin)->put("/team/{$member->id}", [
        'name' => 'Updated Name',
        'email' => $member->email,
        'role' => 'manager',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('users', ['id' => $member->id, 'name' => 'Updated Name', 'role' => 'manager']);
});

test('admin can delete team member', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $member = User::factory()->create(['role' => 'developer']);

    $response = $this->actingAs($admin)->delete("/team/{$member->id}");

    $response->assertRedirect();
    $this->assertSoftDeleted('users', ['id' => $member->id]);
});

test('admin cannot delete themselves', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->delete("/team/{$admin->id}");

    // Should fail gracefully - controller has self-deletion protection
    $this->assertDatabaseHas('users', ['id' => $admin->id, 'deleted_at' => null]);
});
