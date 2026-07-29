<?php

use App\Http\Controllers\Admin\BarberController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified', 'customer'])->group(function () {
    Route::inertia('/reserve', 'customer/reserve')
        ->name('customer.reserve');
});

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
});

require __DIR__.'/settings.php';
