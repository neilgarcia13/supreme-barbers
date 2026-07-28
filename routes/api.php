<?php

use App\Http\Controllers\Api\Customer\ReservationController;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\Customer\BarberAvailabilityController;

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/reservations', [ReservationController::class, 'store'])->name('api.reservations.store');
});

Route::get('/barbers/{barber}/availability', BarberAvailabilityController::class)->name('api.barbers.availability');
