<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barber extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'birthdate',
        'bio',
        'photo_path',
        'is_active',
    ];
}
