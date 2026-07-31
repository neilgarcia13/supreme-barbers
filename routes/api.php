<?php

use App\Http\Controllers\Api\Customer\ReservationController;
use App\Http\Controllers\Api\Customer\BarberIndexController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\Customer\BarberAvailabilityController;

Route::middleware(['auth:sanctum', 'customer'])->group(function () {
    Route::get('/reservations', [ReservationController::class, 'index'])
        ->name('api.reservations.index');

    Route::post('/reservations', [ReservationController::class, 'store'])
        ->name('api.reservations.store');

    Route::patch(
        '/reservations/{reservation}/cancel',
        [ReservationController::class, 'cancel']
    )->name('api.reservations.cancel');
});

Route::get('/barbers/{barber}/availability', BarberAvailabilityController::class)
    ->name('api.barbers.availability');

Route::get('/barbers', BarberIndexController::class)
    ->name('api.barbers.index');
