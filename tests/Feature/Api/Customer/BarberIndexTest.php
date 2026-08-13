<?php

use App\Models\Barber;

it('returns only active barbers with customer-safe fields', function () {
    $activeBarber = Barber::factory()->create([
        'first_name' => 'John',
        'last_name' => 'Doe',
        'photo_path' => 'barbers/john.jpg',
        'is_active' => true,
    ]);

    Barber::factory()->create([
        'first_name' => 'Inactive',
        'last_name' => 'Barber',
        'is_active' => false,
    ]);

    $this
        ->getJson('/api/barbers')
        ->assertOk()
        ->assertExactJson([
            'barbers' => [
                [
                    'id' => $activeBarber->id,
                    'first_name' => 'John',
                    'last_name' => 'Doe',
                    'photo_path' => 'barbers/john.jpg',
                ],
            ],
        ]);
});
