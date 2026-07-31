<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dateTime('cancelled_at')->nullable();
            $table->string('active_slot_key')->nullable();
        });

        DB::table('reservations')
            ->where('status', 'confirmed')
            ->select(['id', 'barber_id', 'starts_at'])
            ->orderBy('id')
            ->chunkById(100, function ($reservations): void {
                foreach ($reservations as $reservation) {
                    $startsAt = Carbon::parse(
                        $reservation->starts_at,
                         config('app.timezone')
                    );

                    $slotKey = sprintf(
                        '%d:%s',
                        $reservation->barber_id,
                        $startsAt->utc()->format('Y-m-d\TH:i:s\Z')
                    );

                    DB::table('reservations')
                        ->where('id', $reservation->id)
                        ->update([
                            'active_slot_key' => $slotKey,
                        ]);
                }
            });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropUnique(['barber_id', 'starts_at']);
            $table->unique('active_slot_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->unique(['barber_id', 'starts_at']);
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropUnique(['active_slot_key']);
            $table->dropColumn([
                'active_slot_key',
                'cancelled_at',
            ]);
        });
    }
};
