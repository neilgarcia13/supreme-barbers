<?php

use App\Models\Barber;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Carbon;

it('returns all reservations with customer and barber details to an admin', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $customer = User::factory()->create([
        'name' => 'Test Customer',
        'email' => 'customer@example.com',
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create([
        'first_name' => 'John',
        'last_name' => 'Doe',
        'photo_path' => 'barbers/john.jpg',
        'is_active' => true,
    ]);

    $startsAt = now()->addDay()->setTime(9, 0);

    $reservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addHour(),
        'status' => 'confirmed',
        'notes' => 'Regular haircut.',
    ]);

    $this
        ->actingAs($admin)
        ->getJson('/api/admin/reservations')
        ->assertOk()
        ->assertJsonCount(1, 'reservations')
        ->assertJsonPath('reservations.0.id', $reservation->id)
        ->assertJsonPath('reservations.0.customer.name', 'Test Customer')
        ->assertJsonPath(
            'reservations.0.customer.email',
            'customer@example.com'
        )
        ->assertJsonPath('reservations.0.barber.first_name', 'John')
        ->assertJsonPath('reservations.0.barber.last_name', 'Doe')
        ->assertJsonPath('reservations.0.barber.is_active', true)
        ->assertJsonMissingPath('reservations.0.active_slot_key')
        ->assertJsonMissingPath('reservations.0.customer.password')
        ->assertJsonMissingPath('reservations.0.barber.birthdate');
});

it('rejects unauthenticated admin reservation requests', function () {
    $this
        ->getJson('/api/admin/reservations')
        ->assertUnauthorized();
});

it('prevents customers from accessing admin reservations', function () {
    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $this
        ->actingAs($customer)
        ->getJson('/api/admin/reservations')
        ->assertForbidden();
});

it('filters reservations by appointment date', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $requestedStart = Carbon::create(
        2026,
        8,
        10,
        9,
        0,
        0,
        'Asia/Manila'
    );

    $requestedReservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $requestedStart,
        'ends_at' => $requestedStart->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    $otherStart = $requestedStart->copy()->addDay();

    Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $otherStart,
        'ends_at' => $otherStart->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    $this
        ->actingAs($admin)
        ->getJson('/api/admin/reservations?date=2026-08-10')
        ->assertOk()
        ->assertJsonCount(1, 'reservations')
        ->assertJsonPath(
            'reservations.0.id',
            $requestedReservation->id
        );
});

it('filters reservations by barber', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create(['role' => 'customer']);
    $selectedBarber = Barber::factory()->create();
    $otherBarber = Barber::factory()->create();
    $startsAt = now()->addDay()->setTime(9, 0);

    $expected = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $selectedBarber->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $otherBarber->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    $this
        ->actingAs($admin)
        ->getJson(
            "/api/admin/reservations?barber_id={$selectedBarber->id}"
        )
        ->assertOk()
        ->assertJsonCount(1, 'reservations')
        ->assertJsonPath('reservations.0.id', $expected->id);
});

it('filters reservations by status', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $confirmedStart = now()->addDay()->setTime(9, 0);

    Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $confirmedStart,
        'ends_at' => $confirmedStart->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    $cancelledStart = now()->addDays(2)->setTime(9, 0);

    $cancelled = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $cancelledStart,
        'ends_at' => $cancelledStart->copy()->addHour(),
        'status' => 'cancelled',
        'cancelled_at' => now(),
    ]);

    $this
        ->actingAs($admin)
        ->getJson('/api/admin/reservations?status=cancelled')
        ->assertOk()
        ->assertJsonCount(1, 'reservations')
        ->assertJsonPath('reservations.0.id', $cancelled->id);
});

it('filters reservations by customer name or email', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $matchingCustomer = User::factory()->create([
        'name' => 'Maria Santos',
        'email' => 'maria@example.com',
        'role' => 'customer',
    ]);

    $otherCustomer = User::factory()->create([
        'name' => 'Juan Dela Cruz',
        'email' => 'juan@example.com',
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create();
    $startsAt = now()->addDay()->setTime(9, 0);

    $matchingReservation = Reservation::create([
        'user_id' => $matchingCustomer->id,
        'barber_id' => $barber->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    $otherStart = $startsAt->copy()->addHour();

    Reservation::create([
        'user_id' => $otherCustomer->id,
        'barber_id' => $barber->id,
        'starts_at' => $otherStart,
        'ends_at' => $otherStart->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    $this
        ->actingAs($admin)
        ->getJson('/api/admin/reservations?search=Maria')
        ->assertOk()
        ->assertJsonCount(1, 'reservations')
        ->assertJsonPath(
            'reservations.0.id',
            $matchingReservation->id
        );

    $this
        ->actingAs($admin)
        ->getJson(
            '/api/admin/reservations?search=maria%40example.com'
        )
        ->assertOk()
        ->assertJsonCount(1, 'reservations')
        ->assertJsonPath(
            'reservations.0.id',
            $matchingReservation->id
        );
});

it('orders reservations by earliest start time first', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $laterStart = now()->addDays(2)->setTime(9, 0);
    $laterReservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $laterStart,
        'ends_at' => $laterStart->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    $earlierStart = now()->addDay()->setTime(9, 0);
    $earlierReservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $earlierStart,
        'ends_at' => $earlierStart->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    $this
        ->actingAs($admin)
        ->getJson('/api/admin/reservations')
        ->assertOk()
        ->assertJsonPath('reservations.0.id', $earlierReservation->id)
        ->assertJsonPath('reservations.1.id', $laterReservation->id);
});

it('rejects an invalid appointment date filter', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this
        ->actingAs($admin)
        ->getJson('/api/admin/reservations?date=08-10-2026')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('date');
});

it('rejects a nonexistent barber filter', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this
        ->actingAs($admin)
        ->getJson('/api/admin/reservations?barber_id=999999')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('barber_id');
});

it('rejects an unsupported reservation status filter', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this
        ->actingAs($admin)
        ->getJson('/api/admin/reservations?status=pending')
        ->assertUnprocessable()
        ->assertJsonValidationErrors('status');
});

it('applies multiple reservation filters together', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $matchingCustomer = User::factory()->create([
        'name' => 'Maria Santos',
        'role' => 'customer',
    ]);
    $otherCustomer = User::factory()->create([
        'name' => 'Juan Dela Cruz',
        'role' => 'customer',
    ]);
    $selectedBarber = Barber::factory()->create();
    $otherBarber = Barber::factory()->create();
    $requestedStart = Carbon::create(
        2026,
        8,
        10,
        9,
        0,
        0,
        'Asia/Manila'
    );

    $expectedReservation = Reservation::create([
        'user_id' => $matchingCustomer->id,
        'barber_id' => $selectedBarber->id,
        'starts_at' => $requestedStart,
        'ends_at' => $requestedStart->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    $otherCustomerStart = $requestedStart->copy()->addHour();
    Reservation::create([
        'user_id' => $otherCustomer->id,
        'barber_id' => $selectedBarber->id,
        'starts_at' => $otherCustomerStart,
        'ends_at' => $otherCustomerStart->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    Reservation::create([
        'user_id' => $matchingCustomer->id,
        'barber_id' => $otherBarber->id,
        'starts_at' => $requestedStart,
        'ends_at' => $requestedStart->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    $otherDateStart = $requestedStart->copy()->addDay();
    Reservation::create([
        'user_id' => $matchingCustomer->id,
        'barber_id' => $selectedBarber->id,
        'starts_at' => $otherDateStart,
        'ends_at' => $otherDateStart->copy()->addHour(),
        'status' => 'confirmed',
    ]);

    $cancelledStart = $requestedStart->copy()->addHours(2);
    Reservation::create([
        'user_id' => $matchingCustomer->id,
        'barber_id' => $selectedBarber->id,
        'starts_at' => $cancelledStart,
        'ends_at' => $cancelledStart->copy()->addHour(),
        'status' => 'cancelled',
        'cancelled_at' => now(),
    ]);

    $this
        ->actingAs($admin)
        ->getJson(
            "/api/admin/reservations?date=2026-08-10&barber_id={$selectedBarber->id}&status=confirmed&search=Maria"
        )
        ->assertOk()
        ->assertJsonCount(1, 'reservations')
        ->assertJsonPath(
            'reservations.0.id',
            $expectedReservation->id
        );
});
