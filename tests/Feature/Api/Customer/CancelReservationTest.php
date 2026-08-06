<?php

use App\Models\Barber;
use App\Models\Reservation;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use App\Notifications\ReservationConfirmed;
use Illuminate\Support\Facades\Notification;

function createCancellationTestReservation(
    User $customer,
    Barber $barber,
    CarbonInterface $startsAt
): Reservation {
    return Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addHour(),
        'status' => 'confirmed',
        'notes' => null,
    ]);
}

it('allows the owner to cancel when more than one hour remains', function () {
    $this->travelTo(
        Carbon::create(2026, 7, 31, 12, 0, 0, 'Asia/Manila')
    );

    $customer = User::factory()->create([
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create();
    $startsAt = now()->addHours(2)->startOfHour();

    $reservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addHour(),
        'status' => 'confirmed',
        'notes' => null,
    ]);

    expect($reservation->active_slot_key)->not->toBeNull();

    $this
        ->actingAs($customer)
        ->patchJson("/api/reservations/{$reservation->id}/cancel")
        ->assertOk()
        ->assertJsonPath('message', 'Reservation cancelled successfully.')
        ->assertJsonPath('reservation.id', $reservation->id)
        ->assertJsonPath('reservation.status', 'cancelled');

    $this->assertDatabaseHas('reservations', [
        'id' => $reservation->id,
        'status' => 'cancelled',
        'active_slot_key' => null,
    ]);

    expect($reservation->fresh()->cancelled_at)->not->toBeNull();
});

it('rejects unauthenticated cancellation requests', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();
    $reservation = createCancellationTestReservation(
        $customer,
        $barber,
        now()->addDay()->setTime(9, 0)
    );

    $this
        ->patchJson("/api/reservations/{$reservation->id}/cancel")
        ->assertUnauthorized();

    expect($reservation->fresh()->status)->toBe('confirmed');
});

it('prevents an admin from cancelling a customer reservation', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();
    $reservation = createCancellationTestReservation(
        $customer,
        $barber,
        now()->addDay()->setTime(9, 0)
    );

    $this
        ->actingAs($admin)
        ->patchJson("/api/reservations/{$reservation->id}/cancel")
        ->assertForbidden();

    expect($reservation->fresh()->status)->toBe('confirmed');
});

it('prevents another customer from cancelling the reservation', function () {
    $owner = User::factory()->create(['role' => 'customer']);
    $otherCustomer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();
    $reservation = createCancellationTestReservation(
        $owner,
        $barber,
        now()->addDay()->setTime(9, 0)
    );
    $activeSlotKey = $reservation->active_slot_key;

    $this
        ->actingAs($otherCustomer)
        ->patchJson("/api/reservations/{$reservation->id}/cancel")
        ->assertForbidden();

    $reservation->refresh();

    expect($reservation->status)->toBe('confirmed');
    expect($reservation->cancelled_at)->toBeNull();
    expect($reservation->active_slot_key)->toBe($activeSlotKey);
});

it('allows cancellation exactly one hour before the appointment', function () {
    $this->travelTo(
        Carbon::create(2026, 7, 31, 12, 0, 0, 'Asia/Manila')
    );

    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();
    $reservation = createCancellationTestReservation(
        $customer,
        $barber,
        now()->addHour()
    );

    $this
        ->actingAs($customer)
        ->patchJson("/api/reservations/{$reservation->id}/cancel")
        ->assertOk();

    expect($reservation->fresh()->status)->toBe('cancelled');
});

it('rejects cancellation when less than one hour remains', function () {
    $this->travelTo(
        Carbon::create(2026, 7, 31, 12, 1, 0, 'Asia/Manila')
    );

    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();
    $startsAt = Carbon::create(
        2026,
        7,
        31,
        13,
        0,
        0,
        'Asia/Manila'
    );
    $reservation = createCancellationTestReservation(
        $customer,
        $barber,
        $startsAt
    );
    $activeSlotKey = $reservation->active_slot_key;

    $this
        ->actingAs($customer)
        ->patchJson("/api/reservations/{$reservation->id}/cancel")
        ->assertConflict()
        ->assertJsonPath(
            'message',
            'Reservations must be cancelled at least one hour before the appointment.'
        );

    $reservation->refresh();

    expect($reservation->status)->toBe('confirmed');
    expect($reservation->cancelled_at)->toBeNull();
    expect($reservation->active_slot_key)->toBe($activeSlotKey);
});

it('rejects cancellation after the appointment has started', function () {
    $this->travelTo(
        Carbon::create(2026, 7, 31, 12, 30, 0, 'Asia/Manila')
    );

    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();
    $startsAt = Carbon::create(
        2026,
        7,
        31,
        12,
        0,
        0,
        'Asia/Manila'
    );
    $reservation = createCancellationTestReservation(
        $customer,
        $barber,
        $startsAt
    );

    $this
        ->actingAs($customer)
        ->patchJson("/api/reservations/{$reservation->id}/cancel")
        ->assertConflict();

    expect($reservation->fresh()->status)->toBe('confirmed');
});

it('rejects repeated cancellation attempts', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();
    $reservation = createCancellationTestReservation(
        $customer,
        $barber,
        now()->addDay()->setTime(9, 0)
    );

    $this
        ->actingAs($customer)
        ->patchJson("/api/reservations/{$reservation->id}/cancel")
        ->assertOk();

    $cancelledAt = $reservation->fresh()->cancelled_at;

    $this
        ->actingAs($customer)
        ->patchJson("/api/reservations/{$reservation->id}/cancel")
        ->assertConflict()
        ->assertJsonPath(
            'message',
            'This reservation has already been cancelled.'
        );

    $reservation->refresh();

    expect($reservation->status)->toBe('cancelled');
    expect($reservation->active_slot_key)->toBeNull();
    expect($reservation->cancelled_at?->equalTo($cancelledAt))->toBeTrue();
});

it('makes a cancelled appointment available again', function () {
    $this->travelTo(
        Carbon::create(2026, 7, 31, 12, 0, 0, 'Asia/Manila')
    );

    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();
    $startsAt = now()->addDay()->setTime(10, 0);
    $reservation = createCancellationTestReservation(
        $customer,
        $barber,
        $startsAt
    );

    $this
        ->actingAs($customer)
        ->patchJson("/api/reservations/{$reservation->id}/cancel")
        ->assertOk();

    $this
        ->getJson(
            "/api/barbers/{$barber->id}/availability"
            ."?date={$startsAt->toDateString()}"
        )
        ->assertOk()
        ->assertJsonPath('slots.1.status', 'available');
});

it('allows another customer to reserve a cancelled appointment slot', function () {
    $this->travelTo(
        Carbon::create(2026, 7, 31, 12, 0, 0, 'Asia/Manila')
    );

    $firstCustomer = User::factory()->create(['role' => 'customer']);
    $secondCustomer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();
    $startsAt = now()->addDay()->setTime(9, 0);
    $cancelledReservation = createCancellationTestReservation(
        $firstCustomer,
        $barber,
        $startsAt
    );
    $releasedSlotKey = $cancelledReservation->active_slot_key;

    $this
        ->actingAs($firstCustomer)
        ->patchJson(
            "/api/reservations/{$cancelledReservation->id}/cancel"
        )
        ->assertOk();

    $this
        ->actingAs($secondCustomer)
        ->postJson('/api/reservations', [
            'barber_id' => $barber->id,
            'starts_at' => $startsAt->toIso8601String(),
            'notes' => null,
        ])
        ->assertCreated();

    $newReservation = Reservation::query()
        ->where('user_id', $secondCustomer->id)
        ->firstOrFail();

    expect($cancelledReservation->fresh()->active_slot_key)->toBeNull();
    expect($newReservation->active_slot_key)->toBe($releasedSlotKey);
    $this->assertDatabaseCount('reservations', 2);
});

it('does not send a confirmation notification when cancelled', function () {
    Notification::fake();

    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $reservation = createCancellationTestReservation(
        $customer,
        $barber,
        now()->addDay()->setTime(9, 0),
    );

    $this
        ->actingAs($customer)
        ->patchJson(
            "/api/reservations/{$reservation->id}/cancel"
        )
        ->assertOk();

    Notification::assertNotSentTo(
        $customer,
        ReservationConfirmed::class,
    );
});
