<?php

use App\Models\Barber;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\ReservationConfirmed;
use Illuminate\Support\Carbon;

it('builds the reservation confirmation email', function () {
    $customer = User::factory()->create([
        'name' => 'Juan Customer',
        'role' => 'customer',
    ]);

    $barber = Barber::factory()->create([
        'first_name' => 'Pedro',
        'last_name' => 'Santos',
    ]);

    $startsAt = Carbon::create(
        2026,
        8,
        10,
        9,
        0,
        0,
        config('app.timezone'),
    );

    $reservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addHour(),
        'notes' => 'Please keep the sides short.',
    ]);

    $reservation->load('barber');

    $mail = (new ReservationConfirmed($reservation))
        ->toMail($customer);

    expect($mail->subject)
        ->toBe('Your reservation is confirmed')
        ->and($mail->greeting)
        ->toBe('Hello Juan Customer,')
        ->and($mail->introLines)
        ->toContain('Your reservation at Supreme Barbers is confirmed.')
        ->and($mail->introLines)
        ->toContain('Barber: Pedro Santos')
        ->and($mail->introLines)
        ->toContain('Date: Monday, August 10, 2026')
        ->and($mail->introLines)
        ->toContain('Time: 9:00 AM - 10:00 AM')
        ->and($mail->introLines)
        ->toContain('Notes: Please keep the sides short.')
        ->and($mail->actionText)
        ->toBe('View My Reservations')
        ->and($mail->actionUrl)
        ->toBe(url('/my-reservations'));
});

it('omits the notes line when no notes were provided', function () {
    $customer = User::factory()->create(['role' => 'customer']);
    $barber = Barber::factory()->create();

    $startsAt = now()->addDay()->setTime(9, 0);

    $reservation = Reservation::create([
        'user_id' => $customer->id,
        'barber_id' => $barber->id,
        'starts_at' => $startsAt,
        'ends_at' => $startsAt->copy()->addHour(),
        'notes' => null,
    ]);

    $mail = (new ReservationConfirmed($reservation))
        ->toMail($customer);

    $containsNotes = collect($mail->introLines)->contains(
        fn ($line): bool => is_string($line) &&
            str_starts_with($line, 'Notes:')
    );

    expect($containsNotes)->toBeFalse();
});
