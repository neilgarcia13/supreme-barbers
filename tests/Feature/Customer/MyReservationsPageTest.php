<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the my reservations page for a customer', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $this
        ->actingAs($customer)
        ->get('/my-reservations')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('customer/reservations/index')
        );
});
