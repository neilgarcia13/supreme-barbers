<?php

use App\Http\Controllers\Admin\BarberController;
use App\Http\Controllers\Admin\ReservationController as AdminReservationController;
use App\Http\Controllers\Customer\ReservationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Customer\ReserveController;

// Public routes
Route::inertia('/', 'welcome')->name('home');

// Shared post-login redirect
Route::get('/dashboard', function (Request $request) {
    return match ($request->user()->role) {
        'admin' => redirect()->route('admin.dashboard'),
        'customer' => redirect()->route('customer.reserve'),
        default => abort(403),
    };
})->middleware(['auth', 'verified'])->name('dashboard');

// Customer reservation pages
Route::middleware(['auth', 'verified', 'customer'])->group(function () {
    Route::get('/reserve', [ReserveController::class, 'index'])
        ->name('customer.reserve');

    Route::get('/reserve/{barber}', [ReserveController::class, 'create'])
        ->name('customer.reserve.create');

    Route::get(
        '/my-reservations',
        [ReservationController::class, 'index']
    )->name('customer.reservations.index');
});

// Admin management pages
Route::middleware(['auth', 'admin'])->group(function () {
    Route::inertia('/admin/dashboard', 'admin/dashboard')->name('admin.dashboard');

    Route::get('/admin/barbers', [BarberController::class, 'index'])
        ->name('admin.barbers.index');

    Route::post('/admin/barbers', [BarberController::class, 'store'])
        ->name('admin.barbers.store');

    Route::get('/admin/barbers/create', [BarberController::class, 'create'])
        ->name('admin.barbers.create');

    Route::put('/admin/barbers/{barber}', [BarberController::class, 'update'])
        ->name('admin.barbers.update');

    Route::delete('/admin/barbers/{barber}', [BarberController::class, 'destroy'])
        ->name('admin.barbers.destroy');

    Route::get('/admin/barbers/{barber}/edit', [BarberController::class, 'edit'])
        ->name('admin.barbers.edit');

    Route::get('/admin/reservations', [AdminReservationController::class, 'index'])
        ->name('admin.reservations.index');
});

// Account settings routes
require __DIR__ . '/settings.php';
