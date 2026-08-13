<?php

use App\Models\Barber;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the admin reservations page with barber filter options', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $firstBarber = Barber::factory()->create([
        'first_name' => 'Adam',
        'last_name' => 'Santos',
        'is_active' => true,
    ]);

    $secondBarber = Barber::factory()->create([
        'first_name' => 'Zoe',
        'last_name' => 'Reyes',
        'is_active' => false,
    ]);

    $this
        ->actingAs($admin)
        ->get('/admin/reservations')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/reservations/index')
            ->has('barbers', 2)
            ->where('barbers.0.id', $firstBarber->id)
            ->where('barbers.1.id', $secondBarber->id)
            ->missing('barbers.0.birthdate')
        );
});

it('redirects guests from the admin reservations page', function () {
    $this
        ->get('/admin/reservations')
        ->assertRedirect(route('login'));
});

it('prevents customers from accessing the admin reservations page', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $this
        ->actingAs($customer)
        ->get('/admin/reservations')
        ->assertForbidden();
});
