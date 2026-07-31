<?php

use App\Models\Barber;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Carbon;

it('returns the customer reservations grouped into upcoming and history', function () {
    $this->travelTo(
        Carbon::create(2026, 7, 31, 12, 0, 0, 'Asia/Manila')
    );

    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create([
        'first_name' => 'John',
        'last_name' => 'Doe',
        'photo_path' => 'barbers/john.jpg',
    ]);

    $upcoming = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => now()->addDay()->setTime(9, 0),
        'ends_at' => now()->addDay()->setTime(10, 0),
        'status' => 'confirmed',
        'notes' => 'Upcoming reservation.',
    ]);

    $history = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => now()->subDay()->setTime(9, 0),
        'ends_at' => now()->subDay()->setTime(10, 0),
        'status' => 'confirmed',
        'notes' => null,
    ]);

    $response = $this
        ->actingAs($customer)
        ->getJson('/api/reservations');

    $response
        ->assertOk()
        ->assertJsonCount(1, 'upcoming')
        ->assertJsonCount(1, 'history')
        ->assertJsonPath('upcoming.0.id', $upcoming->id)
        ->assertJsonPath('upcoming.0.status', 'confirmed')
        ->assertJsonPath('upcoming.0.barber.id', $barber->id)
        ->assertJsonPath('upcoming.0.barber.first_name', 'John')
        ->assertJsonPath('upcoming.0.barber.last_name', 'Doe')
        ->assertJsonPath('upcoming.0.barber.photo_path', 'barbers/john.jpg')
        ->assertJsonPath('history.0.id', $history->id)
        ->assertJsonMissingPath('upcoming.0.user_id')
        ->assertJsonMissingPath('upcoming.0.barber.birthdate');
});

it('rejects unauthenticated reservation listing requests', function () {
    $this
        ->getJson('/api/reservations')
        ->assertUnauthorized();
});

it('prevents an admin from listing customer reservations', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $this
        ->actingAs($admin)
        ->getJson('/api/reservations')
        ->assertForbidden();
});

it('returns only reservations owned by the authenticated customer', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $otherCustomer = User::factory()->create([
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create();

    $ownedReservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => now()->addDay()->setTime(9, 0),
        'ends_at' => now()->addDay()->setTime(10, 0),
        'status' => 'confirmed',
        'notes' => null,
    ]);

    Reservation::create([
        'user_id' => $otherCustomer->id,
        'barber_id' => $barber->id,
        'starts_at' => now()->addDays(2)->setTime(9, 0),
        'ends_at' => now()->addDays(2)->setTime(10, 0),
        'status' => 'confirmed',
        'notes' => null,
    ]);

    $this
        ->actingAs($customer)
        ->getJson('/api/reservations')
        ->assertOk()
        ->assertJsonCount(1, 'upcoming')
        ->assertJsonCount(0, 'history')
        ->assertJsonPath(
            'upcoming.0.id',
            $ownedReservation->id
        );
});

it('orders upcoming reservations by nearest start time first', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $farStart = now()->addDays(3)->setTime(9, 0);
    $nearStart = now()->addDay()->setTime(9, 0);

    $farReservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $farStart,
        'ends_at' => $farStart->copy()->addHour(),
        'status' => 'confirmed',
        'notes' => null,
    ]);

    $nearReservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $nearStart,
        'ends_at' => $nearStart->copy()->addHour(),
        'status' => 'confirmed',
        'notes' => null,
    ]);

    $this
        ->actingAs($customer)
        ->getJson('/api/reservations')
        ->assertOk()
        ->assertJsonPath('upcoming.0.id', $nearReservation->id)
        ->assertJsonPath('upcoming.1.id', $farReservation->id);
});

it('orders reservation history by newest start time first', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $recentStart = now()->subDay()->setTime(9, 0);
    $olderStart = now()->subDays(3)->setTime(9, 0);

    $recentReservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $recentStart,
        'ends_at' => $recentStart->copy()->addHour(),
        'status' => 'confirmed',
        'notes' => null,
    ]);

    $olderReservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $olderStart,
        'ends_at' => $olderStart->copy()->addHour(),
        'status' => 'confirmed',
        'notes' => null,
    ]);

    $this
        ->actingAs($customer)
        ->getJson('/api/reservations')
        ->assertOk()
        ->assertJsonPath('history.0.id', $recentReservation->id)
        ->assertJsonPath('history.1.id', $olderReservation->id);
});

it('places a future cancelled reservation in history', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $startsAt = now()->addDay()->setTime(9, 0);

    $cancelledReservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addHour(),
        'status' => 'cancelled',
        'notes' => null,
    ]);

    $this
        ->actingAs($customer)
        ->getJson('/api/reservations')
        ->assertOk()
        ->assertJsonCount(0, 'upcoming')
        ->assertJsonCount(1, 'history')
        ->assertJsonPath(
            'history.0.id',
            $cancelledReservation->id
        )
        ->assertJsonPath('history.0.status', 'cancelled');
});

it('returns only customer-safe reservation and barber fields', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $barber = Barber::factory()->create([
        'first_name' => 'John',
        'last_name' => 'Doe',
    ]);

    $startsAt = now()->addDay()->setTime(9, 0);

    $reservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addHour(),
        'status' => 'confirmed',
        'notes' => 'Customer notes.',
    ]);

    $this
        ->actingAs($customer)
        ->getJson('/api/reservations')
        ->assertOk()
        ->assertJsonPath('upcoming.0.id', $reservation->id)
        ->assertJsonPath('upcoming.0.notes', 'Customer notes.')
        ->assertJsonPath('upcoming.0.barber.id', $barber->id)
        ->assertJsonMissingPath('upcoming.0.user_id')
        ->assertJsonMissingPath('upcoming.0.barber_id')
        ->assertJsonMissingPath('upcoming.0.created_at')
        ->assertJsonMissingPath('upcoming.0.updated_at')
        ->assertJsonMissingPath('upcoming.0.barber.birthdate')
        ->assertJsonMissingPath('upcoming.0.barber.is_active');
});