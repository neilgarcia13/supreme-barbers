<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BarberAvailabilityRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => [
                'required',
                'date_format:Y-m-d',
                'after_or_equal:today',
                'before_or_equal:'.now(config('app.timezone'))
                    ->addDays((int) config('reservations.advance_booking_days'))
                    ->toDateString(),
            ],
        ];
    }

    public function messages(): array
    {
        $days = (int) config('reservations.advance_booking_days');

        return [
            'date.before_or_equal' => "Availability can only be viewed up to {$days} days in advance.",
        ];
    }
}
