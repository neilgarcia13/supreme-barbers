<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;


use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Barber extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'first_name',
        'last_name',
        'birthdate',
        'photo_path',
        'is_active',
    ];

    protected function casts(): array {
        return [
            'birthdate' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }
    
}
