<?php

use App\Models\Barber;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the reservation page for an active barber', function () {

    $this->travelTo(
        Carbon::create(2026, 8, 7, 8, 0, 0, 'Asia/Manila')
    );

    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create([
        'photo_path' => 'barbers/example.jpg',
    ]);

    $this->actingAs($customer)
        ->get(route('customer.reserve.create', $barber))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('customer/reserve/create')
                ->where('barber.id', $barber->id)
                ->where('barber.first_name', $barber->first_name)
                ->where('barber.last_name', $barber->last_name)
                ->where('barber.photo_path', $barber->photo_path)
                ->where('max_reservation_date', '2026-09-06')
                ->missing('barber.birthdate')
                ->missing('barber.is_active')
        );
});

it('returns not found when reserving with an inactive barber', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create([
        'is_active' => false,
    ]);

    $this->actingAs($customer)
        ->get(route('customer.reserve.create', $barber))
        ->assertNotFound();
});
