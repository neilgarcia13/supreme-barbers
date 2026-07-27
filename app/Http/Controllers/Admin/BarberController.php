<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreBarberRequest;
use App\Http\Requests\Admin\UpdateBarberRequest;
use App\Models\Barber;
use Inertia\Inertia;

class BarberController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $barbers = Barber::query()->latest()->get();

        return Inertia::render('admin/barbers/index', [
            'barbers' => $barbers,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('admin/barbers/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBarberRequest $request)
    {
        $validated = $request->validated();

        if ($request->hasFile('photo_path')) {
            $validated['photo_path'] = $request->file('photo_path')->store('barbers', 'public');
        }

        Barber::create($validated);

        return redirect()->route('admin.barbers.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Barber $barber)
    {
        return Inertia::render('admin/barbers/edit', [
            'barber' => $barber,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBarberRequest $request, Barber $barber)
    {
        $validated = $request->validated();

        if ($request->hasFile('photo_path')) {
            $validated['photo_path'] = $request->file('photo_path')->store('barbers', 'public');
        } else {
            unset($validated['photo_path']);
        }

        $barber->update($validated);

        return redirect()->route('admin.barbers.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Barber $barber)
    {
        $barber->delete();

        return redirect()->route('admin.barbers.index');
    }
}
