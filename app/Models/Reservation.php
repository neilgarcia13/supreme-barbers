<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    protected $fillable = [
        'user_id',
        'barber_id',
        'starts_at',
        'ends_at',
        'notes',
        'status',
        'active_slot_key',
        'cancelled_at',
    ];

    protected $attributes = [
        'status' => 'confirmed',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function barber(): BelongsTo
    {
        return $this->belongsTo(Barber::class);
    }

    public static function makeActiveSlotKey(
        int $barberId,
        CarbonInterface $startsAt
    ): string {
        return sprintf(
            '%d:%s',
            $barberId,
            $startsAt->copy()->utc()->format('Y-m-d\TH:i:s\Z')
        );
    }

    protected static function booted(): void
    {
        static::creating(function (Reservation $reservation): void {
            if ($reservation->status !== 'confirmed') {
                return;
            }

            $reservation->active_slot_key = self::makeActiveSlotKey(
                (int) $reservation->barber_id,
                $reservation->starts_at
            );
        });
    }
}
