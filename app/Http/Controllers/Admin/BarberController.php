<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBarberRequest;
use App\Http\Requests\Admin\UpdateBarberRequest;
use App\Models\Barber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BarberController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $barbers = Barber::query()
            ->latest()
            ->get()
            ->map(
                fn (Barber $barber): array => $this->barberData($barber)
            );

        return Inertia::render('admin/barbers/index', [
            'barbers' => $barbers,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('admin/barbers/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBarberRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('photo_path')) {
            $validated['photo_path'] = $request->file('photo_path')->store('barbers', 'public');
        }

        Barber::create($validated);

        return redirect()->route('admin.barbers.index');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Barber $barber): Response
    {
        return Inertia::render('admin/barbers/edit', [
            'barber' => $this->barberData($barber),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBarberRequest $request, Barber $barber): RedirectResponse
    {
        $validated = $request->validated();
        $oldPhotoPath = $barber->photo_path;
        $hasNewPhoto = $request->hasFile('photo_path');

        if ($hasNewPhoto) {
            $validated['photo_path'] = $request->file('photo_path')->store('barbers', 'public');
        } else {
            unset($validated['photo_path']);
        }

        $barber->update($validated);

        if ($hasNewPhoto && $oldPhotoPath) {
            Storage::disk('public')->delete($oldPhotoPath);
        }

        return redirect()->route('admin.barbers.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Barber $barber): RedirectResponse
    {
        if ($barber->photo_path) {
            Storage::disk('public')->delete($barber->photo_path);
        }

        $barber->delete();

        return redirect()->route('admin.barbers.index');
    }

    /**
     * @return array{
     *     id: int,
     *     first_name: string,
     *     last_name: string,
     *     birthdate: string,
     *     photo_path: string|null,
     *     is_active: bool
     * }
     */
    private function barberData(Barber $barber): array
    {
        return [
            'id' => $barber->id,
            'first_name' => $barber->first_name,
            'last_name' => $barber->last_name,
            'birthdate' => $barber->birthdate->toDateString(),
            'photo_path' => $barber->photo_path,
            'is_active' => $barber->is_active,
        ];
    }
}
