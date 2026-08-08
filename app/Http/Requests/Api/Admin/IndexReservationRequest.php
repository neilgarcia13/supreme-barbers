<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexReservationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => ['sometimes', 'date_format:Y-m-d'],
            'barber_id' => [
                'sometimes',
                'integer',
                Rule::exists('barbers', 'id'),
            ],
            'status' => [
                'sometimes',
                Rule::in(['confirmed', 'cancelled']),
            ],
            'search' => ['sometimes', 'string', 'max:255'],
        ];
    }
}
