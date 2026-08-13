<?php

use App\Http\Controllers\Api\Admin\ReservationIndexController;
use App\Http\Controllers\Api\Customer\BarberAvailabilityController;
use App\Http\Controllers\Api\Customer\BarberIndexController;
use App\Http\Controllers\Api\Customer\ReservationController;
use Illuminate\Support\Facades\Route;

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

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->name('api.admin.')->group(function () {
    Route::get('/reservations', ReservationIndexController::class)->name('reservations.index');
});
