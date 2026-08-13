<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreReservationRequest;
use App\Models\Reservation;
use App\Notifications\ReservationConfirmed;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ReservationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $now = now();

        $baseQuery = $request->user()
            ->reservations()
            ->with('barber:id,first_name,last_name,photo_path');

        $upcoming = (clone $baseQuery)
            ->where('status', 'confirmed')
            ->where('starts_at', '>', $now)
            ->orderBy('starts_at')
            ->get([
                'id',
                'barber_id',
                'starts_at',
                'ends_at',
                'status',
                'notes',
                'cancelled_at',
            ])
            ->map(
                fn (Reservation $reservation) => $this->reservationData($reservation)
            );

        $history = (clone $baseQuery)
            ->where(function ($query) use ($now): void {
                $query
                    ->where('status', '!=', 'confirmed')
                    ->orWhere('starts_at', '<=', $now);
            })
            ->orderByDesc('starts_at')
            ->get([
                'id',
                'barber_id',
                'starts_at',
                'ends_at',
                'status',
                'notes',
                'cancelled_at',
            ])
            ->map(
                fn (Reservation $reservation) => $this->reservationData($reservation)
            );

        return response()->json([
            'upcoming' => $upcoming,
            'history' => $history,
        ]);
    }

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

        $request->user()->notify(
            new ReservationConfirmed($reservation)
        );

        return response()->json([
            'message' => 'Reservation confirmed successfully.',
            'reservation' => $reservation,
        ], Response::HTTP_CREATED);

    }

    /**
     * @return array{
     *     id: int,
     *     starts_at: string,
     *     ends_at: string,
     *     status: string,
     *     notes: string|null,
     *     barber: array{
     *         id: int,
     *         first_name: string,
     *         last_name: string,
     *         photo_path: string|null
     *     },
     *     cancelled_at: string|null
     * }
     */
    private function reservationData(Reservation $reservation): array
    {
        return [
            'id' => $reservation->id,
            'starts_at' => $reservation->starts_at->toIso8601String(),
            'ends_at' => $reservation->ends_at->toIso8601String(),
            'status' => $reservation->status,
            'notes' => $reservation->notes,
            'barber' => [
                'id' => $reservation->barber->id,
                'first_name' => $reservation->barber->first_name,
                'last_name' => $reservation->barber->last_name,
                'photo_path' => $reservation->barber->photo_path,
            ],
            'cancelled_at' => $reservation->cancelled_at?->toIso8601String(),
        ];
    }

    public function cancel(
        Request $request,
        Reservation $reservation
    ): JsonResponse {
        abort_unless(
            (int) $reservation->user_id === (int) $request->user()->id,
            Response::HTTP_FORBIDDEN
        );

        return DB::transaction(function () use ($reservation): JsonResponse {
            $reservation = Reservation::query()
                ->lockForUpdate()
                ->findOrFail($reservation->id);

            if ($reservation->status === 'cancelled') {
                return response()->json([
                    'message' => 'This reservation has already been cancelled.',
                ], Response::HTTP_CONFLICT);
            }

            $cancellationCutoff = $reservation->starts_at
                ->copy()
                ->subHour();

            if (now()->gt($cancellationCutoff)) {
                return response()->json([
                    'message' => 'Reservations must be cancelled at least one hour before the appointment.',
                ], Response::HTTP_CONFLICT);
            }

            $reservation->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
                'active_slot_key' => null,
            ]);

            $reservation->load(
                'barber:id,first_name,last_name,photo_path'
            );

            return response()->json([
                'message' => 'Reservation cancelled successfully.',
                'reservation' => $this->reservationData($reservation),
            ]);
        });
    }
}
