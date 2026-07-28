<?php

use App\Models\Barber;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Carbon;

it('returns hourly slots and marks reserved appointments', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create();

    $date = now()->addDay()->startOfDay();
    $reservedStart = $date->copy()->setTime(10, 0);

    Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $reservedStart,
        'ends_at' => $reservedStart->copy()->addHour(),
        'status' => 'confirmed',
        'notes' => null,
    ]);

    $response = $this->getJson(
        "/api/barbers/{$barber->id}/availability?date={$date->toDateString()}"
    );

    $response
        ->assertOk()
        ->assertJsonPath('date', $date->toDateString())
        ->assertJsonPath('barber.id', $barber->id)
        ->assertJsonCount(12, 'slots')
        ->assertJsonPath('slots.0.status', 'available')
        ->assertJsonPath('slots.1.status', 'reserved')
        ->assertJsonMissingPath('slots.1.user_id');
});

it('requires a date for availability', function () {
    $barber = Barber::factory()->create();

    $this
        ->getJson("/api/barbers/{$barber->id}/availability")
        ->assertUnprocessable()
        ->assertJsonValidationErrors('date');
});

it('rejects an incorrectly formatted availability date', function () {
    $barber = Barber::factory()->create();

    $this
        ->getJson(
            "/api/barbers/{$barber->id}/availability?date=07-29-2026"
        )
        ->assertUnprocessable()
        ->assertJsonValidationErrors('date');
});

it('rejects a past availability date', function () {
    $barber = Barber::factory()->create();

    $pastDate = now()->subDay()->toDateString();

    $this
        ->getJson(
            "/api/barbers/{$barber->id}/availability?date={$pastDate}"
        )
        ->assertUnprocessable()
        ->assertJsonValidationErrors('date');
});

it('returns not found for an inactive barber', function () {
    $barber = Barber::factory()->create([
        'is_active' => false,
    ]);

    $date = now()->addDay()->toDateString();

    $this
        ->getJson(
            "/api/barbers/{$barber->id}/availability?date={$date}"
        )
        ->assertNotFound()
        ->assertJsonPath('message', 'Barber not found.');
});

it('returns not found for a nonexistent barber', function () {
    $date = now()->addDay()->toDateString();

    $this
        ->getJson(
            "/api/barbers/999999/availability?date={$date}"
        )
        ->assertNotFound();
});

it('does not mark cancelled reservations as reserved', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create();

    $date = now()->addDay()->startOfDay();
    $startsAt = $date->copy()->setTime(10, 0);

    Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addHour(),
        'status' => 'cancelled',
        'notes' => null,
    ]);

    $this
        ->getJson(
            "/api/barbers/{$barber->id}/availability"
            . "?date={$date->toDateString()}"
        )
        ->assertOk()
        ->assertJsonPath('slots.1.status', 'available');
});

it('marks elapsed appointment slots as unavailable for today', function () {
    $this->travelTo(
        Carbon::create(2026, 7, 28, 13, 30, 0, 'Asia/Manila')
    );

    $barber = Barber::factory()->create();
    $date = now()->toDateString();

    $this
        ->getJson(
            "/api/barbers/{$barber->id}/availability?date={$date}"
        )
        ->assertOk()
        ->assertJsonPath('slots.0.status', 'unavailable')
        ->assertJsonPath('slots.4.status', 'unavailable')
        ->assertJsonPath('slots.5.status', 'available');
});