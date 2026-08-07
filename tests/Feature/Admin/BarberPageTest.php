<?php

use App\Models\Barber;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('provides date-only birthdates on the barber index', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    Barber::factory()->create([
        'birthdate' => '2000-12-01',
    ]);

    $this
        ->actingAs($admin)
        ->get(route('admin.barbers.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/barbers/index')
            ->where('barbers.0.birthdate', '2000-12-01')
        );
});

it('provides a date-only birthdate when editing a barber', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $barber = Barber::factory()->create([
        'birthdate' => '2000-12-01',
    ]);

    $this
        ->actingAs($admin)
        ->get(route('admin.barbers.edit', $barber))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/barbers/edit')
            ->where('barber.birthdate', '2000-12-01')
        );
});