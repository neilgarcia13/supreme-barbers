# Supreme Barbers

Supreme Barbers is a barber availability and reservation system built to help customers find available barbers and book reservations before visiting the shop.

## Features

### Customer

- Account registration and authentication
- View active barbers
- Check daily appointment availability
- Reserve one-hour appointments
- Add optional reservation notes
- View upcoming and previous reservations
- Cancel reservations within the allowed cutoff
- Receive reservation confirmation emails

### Admin

- Create, update, and delete barbers
- Manage barber availability
- View and filter customer reservations
- View each barber's daily schedule
- Download daily schedules as PNG images

## Tech Stack

- Laravel 13
- React 19 with TypeScript
- Inertia.js
- Tailwind CSS
- shadcn/ui
- SQLite
- Pest
- Resend for transactional email

## Local Setup

### Requirements

- PHP 8.3 or newer
- Composer
- Node.js 22
- pnpm 11

### Installation

```bash
git clone https://github.com/neilgarcia13/supreme-barbers.git
cd supreme-barbers

composer install
pnpm install

cp .env.example .env
php artisan key:generate

php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
php artisan migrate
php artisan storage:link
