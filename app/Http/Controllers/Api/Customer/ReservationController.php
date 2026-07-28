<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreReservationRequest;
use App\Models\Reservation;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

class ReservationController extends Controller
{
    public function store(StoreReservationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $startsAt = Carbon::parse($validated['starts_at'])->setTimezone(config('app.timezone'));
        $endsAt = $startsAt->copy()->addHour();

        try {
            $reservation = Reservation::create([
                'user_id' => $request->user()->id,
                'barber_id' => $validated['barber_id'],
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'status' => 'confirmed',
                'notes' => $validated['notes'] ?? null,
            ]);
        } catch (UniqueConstraintViolationException) {
            return response()->json([
                'message' => 'The selected appointment is no longer available.',
                'errors' => [
                    'starts_at' => [
                        'This barber is already reserved for the selected time.',
                    ],
                ],
            ], Response::HTTP_CONFLICT);
        }

        $reservation->load(
            'barber:id,first_name,last_name,photo_path'
        );

        return response()->json([
            'message' => 'Reservation confirmed successfully.',
            'reservation' => $reservation,
        ], Response::HTTP_CREATED);

    }
}
