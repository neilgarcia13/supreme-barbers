<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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
    ];

    protected function casts(): array {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo {
        return $this->belongsTo(User::class);
    }

    public function barber(): BelongsTo {
        return $this->belongsTo(Barber::class);
    }
}
