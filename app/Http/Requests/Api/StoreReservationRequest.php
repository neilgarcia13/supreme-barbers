<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreReservationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'customer';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'barber_id' => [
                'required',
                'integer',
                Rule::exists('barbers', 'id')->where('is_active', true),
            ],
            'starts_at' => [
                'required',
                'date',
                'after:now',
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->has('starts_at')) {
                    return;
                }

                $startsAt = Carbon::parse($this->input('starts_at'))
                    ->setTimezone(config('app.timezone'));

                $advanceBookingDays = (int) config('reservations.advance_booking_days');

                $latestAllowedDate = now(config('app.timezone'))
                    ->startOfDay()
                    ->addDays($advanceBookingDays)
                    ->endOfDay();

                if ($startsAt->gt($latestAllowedDate)) {
                    $validator->errors()->add(
                        'starts_at',
                        "Reservations can only be made up to {$advanceBookingDays} days in advance."
                    );
                }

                if ($startsAt->minute !== 0 || $startsAt->second !== 0) {
                    $validator->errors()->add(
                        'starts_at',
                        'Appointments must begin exactly on the hour.'
                    );
                }

                if ($startsAt->hour < 9 || $startsAt->hour > 20) {
                    $validator->errors()->add(
                        'starts_at',
                        'Appointments must start between 9:00 AM and 8:00 PM.'
                    );
                }
            },
        ];
    }
}
