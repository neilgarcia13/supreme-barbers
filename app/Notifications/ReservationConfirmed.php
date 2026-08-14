<?php

namespace App\Notifications;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ReservationConfirmed extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public Reservation $reservation,
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     *
     * @param  User  $notifiable
     */
    public function toMail(object $notifiable): MailMessage
    {
        $startsAt = $this->reservation->starts_at
            ->copy()
            ->timezone(config('app.timezone'));

        $endsAt = $this->reservation->ends_at
            ->copy()
            ->timezone(config('app.timezone'));

        $barberName = sprintf(
            '%s %s',
            $this->reservation->barber->first_name,
            $this->reservation->barber->last_name,
        );

        return (new MailMessage)
            ->subject('Your reservation is confirmed')
            ->markdown('mail.reservations.confirmed', [
                'customerName' => $notifiable->name,
                'barberName' => $barberName,
                'date' => $startsAt->format('l, F j, Y'),
                'time' => sprintf(
                    '%s - %s',
                    $startsAt->format('g:i A'),
                    $endsAt->format('g:i A'),
                ),
                'notes' => $this->reservation->notes,
                'reservationsUrl' => url('/my-reservations'),
            ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
