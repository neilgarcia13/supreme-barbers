<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Barber;
use Inertia\Inertia;
use Inertia\Response;

class ReservationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/reservations/index', [
            'barbers' => Barber::query()
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get([
                    'id',
                    'first_name',
                    'last_name',
                    'is_active',
                ]),
        ]);
    }
}
