<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;

use App\Http\Requests\Api\Admin\IndexReservationRequest;

class ReservationIndexController extends Controller
{
    public function __invoke(IndexReservationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $reservations = Reservation::query()
            ->with([
                'user:id,name,email',
                'barber:id,first_name,last_name,photo_path,is_active',
            ])
            ->when(
                isset($validated['date']),
                fn($query) => $query->whereDate(
                    'starts_at',
                    $validated['date']
                )
            )
            ->when(
                isset($validated['barber_id']),
                fn($query) => $query->where(
                    'barber_id',
                    $validated['barber_id']
                )
            )
            ->when(
                isset($validated['status']),
                fn($query) => $query->where(
                    'status',
                    $validated['status']
                )
            )->when(
                isset($validated['search']),
                function ($query) use ($validated): void {
                    $search = trim($validated['search']);

                    $query->whereHas(
                        'user',
                        function ($userQuery) use ($search): void {
                            $userQuery
                                ->whereLike('name', "%{$search}%")
                                ->orWhereLike('email', "%{$search}%");
                        }
                    );
                }
            )
            ->orderBy('starts_at')
            ->get([
                'id',
                'user_id',
                'barber_id',
                'starts_at',
                'ends_at',
                'status',
                'notes',
                'cancelled_at',
            ])
            ->map(fn(Reservation $reservation) => [
                'id' => $reservation->id,
                'starts_at' => $reservation->starts_at->toIso8601String(),
                'ends_at' => $reservation->ends_at->toIso8601String(),
                'status' => $reservation->status,
                'notes' => $reservation->notes,
                'cancelled_at' =>
                    $reservation->cancelled_at?->toIso8601String(),
                'customer' => [
                    'id' => $reservation->user->id,
                    'name' => $reservation->user->name,
                    'email' => $reservation->user->email,
                ],
                'barber' => [
                    'id' => $reservation->barber->id,
                    'first_name' => $reservation->barber->first_name,
                    'last_name' => $reservation->barber->last_name,
                    'photo_path' => $reservation->barber->photo_path,
                    'is_active' => $reservation->barber->is_active,
                ],
            ]);

        return response()->json([
            'reservations' => $reservations,
        ]);
    }
}