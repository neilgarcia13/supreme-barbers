<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('customers are redirected from dashboard to reserve', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $this->actingAs($customer)
        ->get(route('dashboard'))
        ->assertRedirect(route('customer.reserve'));
});

test('admins are redirected from dashboard to admin dashboard', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertRedirect(route('admin.dashboard'));
});

test('customers can access the reserve page', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $this->actingAs($customer)
        ->get(route('customer.reserve'))
        ->assertOk();
});

test('admins cannot access the reserve page', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->get(route('customer.reserve'))
        ->assertForbidden();
});