<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $barber_id
 * @property Carbon $starts_at
 * @property Carbon $ends_at
 * @property string|null $notes
 * @property string $status
 * @property string|null $active_slot_key
 * @property Carbon|null $cancelled_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Barber $barber
 */
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

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<Barber, $this>
     */
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
