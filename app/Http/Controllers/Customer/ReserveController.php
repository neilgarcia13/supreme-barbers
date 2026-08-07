<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Barber;
use Inertia\Inertia;
use Inertia\Response;

class ReserveController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('customer/reserve/index');
    }

    public function create(Barber $barber): Response
    {
        abort_unless($barber->is_active, 404);

        return Inertia::render('customer/reserve/create', [
            'barber' => $barber->only([
                'id',
                'first_name',
                'last_name',
                'photo_path',
            ]),
            'max_reservation_date' => now(config('app.timezone'))
                ->startOfDay()
                ->addDays(
                    (int) config('reservations.advance_booking_days')
                )
                ->toDateString(),
        ]);
    }
}
