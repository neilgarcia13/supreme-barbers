<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'neilgrande2002@gmail.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('SupremeBarbers2026!'),
                'role' => 'admin'
            ]
        );
    }
}
