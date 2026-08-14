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

    $html = (string) $mail->render();

    expect($mail->subject)
        ->toBe('Your reservation is confirmed')
        ->and($mail->markdown)
        ->toBe('mail.reservations.confirmed')
        ->and($mail->viewData)
        ->toMatchArray([
            'customerName' => 'Juan Customer',
            'barberName' => 'Pedro Santos',
            'date' => 'Monday, August 10, 2026',
            'time' => '9:00 AM - 10:00 AM',
            'notes' => 'Please keep the sides short.',
            'reservationsUrl' => url('/my-reservations'),
        ]);

    expect($html)
        ->toContain('Hello Juan Customer,')
        ->toContain('Pedro Santos')
        ->toContain('Monday, August 10, 2026')
        ->toContain('9:00 AM - 10:00 AM')
        ->toContain('Please keep the sides short.')
        ->toContain('View My Reservations');
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

    $html = (string) $mail->render();

    expect($mail->viewData['notes'])->toBeNull()
        ->and($html)->not->toContain('Reservation notes');
});
