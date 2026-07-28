<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\BarberAvailabilityRequest;
use App\Models\Barber;
use App\Models\Reservation;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Symfony\Component\HttpFoundation\Response;

class BarberAvailabilityController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(
        BarberAvailabilityRequest $request,
        Barber $barber
    ): JsonResponse {
        if (!$barber->is_active) {
            return response()->json([
                'message' => 'Barber not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        $date = Carbon::createFromFormat(
            'Y-m-d',
            $request->validated('date'),
            config('app.timezone')
        )->startOfDay();

        $reservedStartTimes = $barber->reservations()
            ->where('status', 'confirmed')
            ->whereBetween('starts_at', [
                $date->copy()->startOfDay(),
                $date->copy()->endOfDay(),
            ])
            ->get(['starts_at'])
            ->map(
                fn(Reservation $reservation) =>
                $reservation->starts_at->format('H:i:s')
            )
            ->all();

        $currentTime = now();

        $slots = collect(range(9, 20))->map(
            function (int $hour) use ($date, $reservedStartTimes, $currentTime): array {
                $startsAt = $date->copy()->setTime($hour, 0);
                $endsAt = $startsAt->copy()->addHour();

                if ($startsAt->lte($currentTime)) {
                    $status = 'unavailable';
                } elseif (
                    in_array(
                        $startsAt->format('H:i:s'),
                        $reservedStartTimes,
                        true
                    )
                ) {
                    $status = 'reserved';
                } else {
                    $status = 'available';
                }

                return [
                    'starts_at' => $startsAt->toIso8601String(),
                    'ends_at' => $endsAt->toIso8601String(),
                    'status' => $status,
                ];
            }
        );

        return response()->json([
            'date' => $date->toDateString(),
            'barber' => [
                'id' => $barber->id,
                'first_name' => $barber->first_name,
                'last_name' => $barber->last_name,
            ],
            'slots' => $slots,
        ]);
    }
}
