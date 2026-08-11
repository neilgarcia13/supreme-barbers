<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Barber;
use Inertia\Inertia;
use Inertia\Response;

class BarberScheduleController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('admin/schedules/index', [
            'today' => now()->toDateString(),
            'barbers' => Barber::query()
                ->orderByDesc('is_active')
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