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

        $message = (new MailMessage)
            ->subject('Your reservation is confirmed')
            ->greeting("Hello {$notifiable->name},")
            ->line('Your reservation at Supreme Barbers is confirmed.')
            ->line("Barber: {$barberName}")
            ->line("Date: {$startsAt->format('l, F j, Y')}")
            ->line(sprintf(
                'Time: %s - %s',
                $startsAt->format('g:i A'),
                $endsAt->format('g:i A'),
            ));

        if (filled($this->reservation->notes)) {
            $message->line("Notes: {$this->reservation->notes}");
        }

        return $message
            ->action('View My Reservations', url('/my-reservations'))
            ->line('Please arrive a few minutes before your appointment.');
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
