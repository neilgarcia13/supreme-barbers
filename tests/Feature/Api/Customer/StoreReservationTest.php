<?php

use App\Models\Barber;
use App\Models\User;
use App\Notifications\ReservationConfirmed;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Notification;

it('allows a customer to create a confirmed reservation', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create();

    $startsAt = now()->addDay()->setTime(9, 0);

    $response = $this
        ->actingAs($customer)
        ->postJson(route('api.reservations.store'), [
            'barber_id' => $barber->id,
            'starts_at' => $startsAt->toIso8601String(),
            'notes' => 'Please keep the sides short.',
        ]);

    $response
        ->assertCreated()
        ->assertJsonPath('reservation.status', 'confirmed')
        ->assertJsonPath('reservation.barber.id', $barber->id);

    $this->assertDatabaseHas('reservations', [
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $startsAt->format('Y-m-d H:i:s'),
        'ends_at' => $startsAt->copy()->addHour()->format('Y-m-d H:i:s'),
        'status' => 'confirmed',
        'notes' => 'Please keep the sides short.',
    ]);
});

it('rejects unauthenticated reservation requests', function () {
    $barber = Barber::factory()->create();

    $startsAt = now()->addDay()->setTime(9, 0);

    $this->postJson(route('api.reservations.store'), [
        'barber_id' => $barber->id,
        'starts_at' => $startsAt->toIso8601String(),
    ])->assertUnauthorized();

    $this->assertDatabaseCount('reservations', 0);
});

it('prevents an admin from creating a reservation', function () {
    $admin = User::factory()->create([
        'role' => 'admin',
    ]);

    $barber = Barber::factory()->create();

    $startsAt = now()->addDay()->setTime(9, 0);

    $this
        ->actingAs($admin)
        ->postJson(route('api.reservations.store'), [
            'barber_id' => $barber->id,
            'starts_at' => $startsAt->toIso8601String(),
        ])
        ->assertForbidden();

    $this->assertDatabaseCount('reservations', 0);
});

it('rejects reservations for an inactive barber', function () {
    $customer = User::factory()->create(['role' => 'customer']);

    $barber = Barber::factory()->create([
        'is_active' => false,
    ]);

    $startsAt = now()->addDay()->setTime(9, 0);

    $this
        ->actingAs($customer)
        ->postJson(route('api.reservations.store'), [
            'barber_id' => $barber->id,
            'starts_at' => $startsAt->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('barber_id');

    $this->assertDatabaseCount('reservations', 0);
});

it('rejects appointments in the past', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $startsAt = now()->subDay()->setTime(9, 0);

    $this
        ->actingAs($customer)
        ->postJson(route('api.reservations.store'), [
            'barber_id' => $barber->id,
            'starts_at' => $startsAt->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('starts_at');

    $this->assertDatabaseCount('reservations', 0);
});

it('rejects appointments that do not start on the hour', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $startsAt = now()->addDay()->setTime(9, 30);

    $this
        ->actingAs($customer)
        ->postJson(route('api.reservations.store'), [
            'barber_id' => $barber->id,
            'starts_at' => $startsAt->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('starts_at');

    $this->assertDatabaseCount('reservations', 0);
});

it('rejects appointments outside operating hours', function (int $hour) {
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $startsAt = now()->addDay()->setTime($hour, 0);

    $this
        ->actingAs($customer)
        ->postJson(route('api.reservations.store'), [
            'barber_id' => $barber->id,
            'starts_at' => $startsAt->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('starts_at');

    $this->assertDatabaseCount('reservations', 0);
})->with([
    'before opening' => 8,
    'at closing time' => 21,
]);

it('prevents two customers from reserving the same barber and time', function () {
    Notification::fake();
    $firstCustomer = User::factory()->create(['role' => 'customer']);
    $secondCustomer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $startsAt = now()->addDay()->setTime(9, 0);
    $payload = [
        'barber_id' => $barber->id,
        'starts_at' => $startsAt->toIso8601String(),
    ];

    $this
        ->actingAs($firstCustomer)
        ->postJson(route('api.reservations.store'), $payload)
        ->assertCreated();

    $this
        ->actingAs($secondCustomer)
        ->postJson(route('api.reservations.store'), $payload)
        ->assertConflict()
        ->assertJsonPath(
            'errors.starts_at.0',
            'This barber is already reserved for the selected time.'
        );

    $this->assertDatabaseCount('reservations', 1);

    Notification::assertSentTo(
        $firstCustomer,
        ReservationConfirmed::class,
    );

    Notification::assertNotSentTo(
        $secondCustomer,
        ReservationConfirmed::class,
    );
});

it('rejects notes longer than one thousand characters', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $this
        ->actingAs($customer)
        ->postJson(route('api.reservations.store'), [
            'barber_id' => $barber->id,
            'starts_at' => now()->addDay()->setTime(9, 0)->toIso8601String(),
            'notes' => str_repeat('a', 1001),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('notes');

    $this->assertDatabaseCount('reservations', 0);
});

it('queues a confirmation notification after creating a reservation', function () {
    Notification::fake();

    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create();
    $startsAt = now()->addDay()->setTime(9, 0);

    $this
        ->actingAs($customer)
        ->postJson(route('api.reservations.store'), [
            'barber_id' => $barber->id,
            'starts_at' => $startsAt->toIso8601String(),
        ])
        ->assertCreated();

    Notification::assertSentTo(
        $customer,
        ReservationConfirmed::class,
        function (ReservationConfirmed $notification, array $channels) use ($customer, $barber): bool {
            return $notification instanceof ShouldQueue
                && $channels === ['mail']
                && $notification->reservation->user_id === $customer->id
                && $notification->reservation->barber_id === $barber->id;
        },
    );
});

it('allows reservations exactly thirty days ahead', function () {
    $this->travelTo(
        Carbon::create(2026, 8, 7, 8, 0, 0, 'Asia/Manila')
    );

    Notification::fake();

    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();
    $startsAt = now()->addDays(30)->setTime(9, 0);

    $this
        ->actingAs($customer)
        ->postJson(route('api.reservations.store'), [
            'barber_id' => $barber->id,
            'starts_at' => $startsAt->toIso8601String(),
        ])
        ->assertCreated();
});

it('rejects reservations more than thirty days ahead', function () {
    $this->travelTo(
        Carbon::create(2026, 8, 7, 8, 0, 0, 'Asia/Manila')
    );

    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();
    $startsAt = now()->addDays(31)->setTime(9, 0);

    $this
        ->actingAs($customer)
        ->postJson(route('api.reservations.store'), [
            'barber_id' => $barber->id,
            'starts_at' => $startsAt->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('starts_at');

    $this->assertDatabaseCount('reservations', 0);
});
