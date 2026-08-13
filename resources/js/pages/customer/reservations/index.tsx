import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    Clock3,
    StickyNote,
    UserRound,
} from 'lucide-react';
import { CalendarX2, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { ApiError, apiRequest } from '@/lib/api';

type ReservationBarber = {
    id: number;
    first_name: string;
    last_name: string;
    photo_path: string | null;
};

type CustomerReservation = {
    id: number;
    starts_at: string;
    ends_at: string;
    status: 'confirmed' | 'cancelled';
    notes: string | null;
    cancelled_at: string | null;
    barber: ReservationBarber;
};

type ReservationsResponse = {
    upcoming: CustomerReservation[];
    history: CustomerReservation[];
};

type CancelReservationResponse = {
    message: string;
    reservation: CustomerReservation;
};

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

const getStatusLabel = (reservation: CustomerReservation) => {
    if (reservation.status === 'cancelled') {
        return 'Cancelled';
    }

    const now = Date.now();

    if (new Date(reservation.starts_at).getTime() > now) {
        return 'Confirmed';
    }

    if (new Date(reservation.ends_at).getTime() > now) {
        return 'In progress';
    }

    return 'Completed';
};

type ReservationCardProps = {
    reservation: CustomerReservation;
    onCancelRequest?: (reservation: CustomerReservation) => void;
};

const ReservationCard = ({
    reservation,
    onCancelRequest,
}: ReservationCardProps) => {
    const startsAt = new Date(reservation.starts_at);
    const endsAt = new Date(reservation.ends_at);
    const statusLabel = getStatusLabel(reservation);

    const accentClass = {
        Confirmed: 'border-l-emerald-500',
        'In progress': 'border-l-amber-500',
        Completed: 'border-l-muted-foreground/30',
        Cancelled: 'border-l-destructive',
    }[statusLabel];

    return (
        <Card
            className={`gap-0 overflow-hidden rounded-lg border-l-4 py-0 ${accentClass}`}
        >
            <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                    <div className="flex items-center gap-3 border-b bg-muted/30 p-4 sm:w-60 sm:border-r sm:border-b-0">
                        {reservation.barber.photo_path ? (
                            <img
                                src={`/storage/${reservation.barber.photo_path}`}
                                alt={`${reservation.barber.first_name} ${reservation.barber.last_name}`}
                                className="size-14 shrink-0 rounded-md object-cover"
                            />
                        ) : (
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-md bg-muted">
                                <UserRound className="size-7 text-muted-foreground" />
                            </div>
                        )}

                        <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">
                                Barber
                            </p>
                            <p className="truncate font-semibold">
                                {reservation.barber.first_name}{' '}
                                {reservation.barber.last_name}
                            </p>
                        </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-4 p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="space-y-2">
                                <div className="flex items-start gap-2 text-sm font-medium">
                                    <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                    <span>
                                        {dateFormatter.format(startsAt)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock3 className="size-4 shrink-0" />
                                    <span>
                                        {timeFormatter.format(startsAt)} -{' '}
                                        {timeFormatter.format(endsAt)}
                                    </span>
                                </div>
                            </div>

                            <Badge
                                variant={
                                    statusLabel === 'Cancelled'
                                        ? 'destructive'
                                        : statusLabel === 'Confirmed'
                                          ? 'default'
                                          : 'secondary'
                                }
                                className="self-start"
                            >
                                {statusLabel}
                            </Badge>
                        </div>

                        {reservation.notes && (
                            <div className="flex items-start gap-2 border-t pt-3 text-sm text-muted-foreground">
                                <StickyNote className="mt-0.5 size-4 shrink-0" />
                                <p className="wrap-break-word whitespace-pre-wrap">
                                    {reservation.notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {onCancelRequest && (
                    <div className="flex justify-end border-t p-4 sm:px-5">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="cursor-pointer"
                            onClick={() => onCancelRequest(reservation)}
                        >
                            <CalendarX2 />
                            Cancel Reservation
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const Index = () => {
    const [upcoming, setUpcoming] = useState<CustomerReservation[]>([]);
    const [history, setHistory] = useState<CustomerReservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [reservationToCancel, setReservationToCancel] =
        useState<CustomerReservation | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const fetchReservations = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await apiRequest<ReservationsResponse>(
                    '/api/reservations',
                    { signal: controller.signal },
                );

                setUpcoming(result.upcoming);
                setHistory(result.history);
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                setError('Failed to load your reservations.');
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        void fetchReservations();

        return () => controller.abort();
    }, []);

    const handleCancel = async () => {
        if (!reservationToCancel || isCancelling) {
            return;
        }

        setIsCancelling(true);

        try {
            const result = await apiRequest<CancelReservationResponse>(
                `/api/reservations/${reservationToCancel.id}/cancel`,
                {
                    method: 'PATCH',
                },
            );

            setUpcoming((current) =>
                current.filter(
                    (reservation) => reservation.id !== result.reservation.id,
                ),
            );

            setHistory((current) =>
                [...current, result.reservation].sort(
                    (first, second) =>
                        new Date(second.starts_at).getTime() -
                        new Date(first.starts_at).getTime(),
                ),
            );

            toast.success(result.message);
            setReservationToCancel(null);
        } catch (error) {
            toast.error(
                error instanceof ApiError
                    ? error.message
                    : 'Unable to cancel the reservation.',
            );
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <>
            <Head title="My Reservations" />

            <section className="space-y-8">
                <header>
                    <h1 className="text-2xl font-semibold">My Reservations</h1>
                    <p className="mb-12 text-sm text-muted-foreground">
                        View your upcoming and previous reservations.
                    </p>
                </header>

                {isLoading && (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton
                                key={index}
                                className="h-40 w-full rounded-lg"
                            />
                        ))}
                    </div>
                )}

                {!isLoading && error && (
                    <Alert variant="destructive">
                        <AlertCircle />
                        <AlertTitle>
                            Failed to load reservations. Please try again.
                        </AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {!isLoading &&
                    !error &&
                    upcoming.length === 0 &&
                    history.length === 0 && (
                        <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                            <h2 className="mt-4 font-semibold">
                                No reservations yet
                            </h2>
                            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                Your upcoming and previous reservations will
                                appear here.
                            </p>
                        </div>
                    )}

                {!isLoading &&
                    !error &&
                    (upcoming.length > 0 || history.length > 0) && (
                        <div className="space-y-10">
                            <section className="space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            Upcoming ({upcoming.length})
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            Reservations can be cancelled until
                                            one hour before the reservation.
                                        </p>
                                    </div>
                                </div>

                                {upcoming.length === 0 ? (
                                    <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                        You have no upcoming reservations.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {upcoming.map((reservation) => (
                                            <ReservationCard
                                                key={reservation.id}
                                                reservation={reservation}
                                                onCancelRequest={
                                                    setReservationToCancel
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <h2 className="text-lg font-semibold">
                                        History ({history.length})
                                    </h2>
                                </div>

                                {history.length === 0 ? (
                                    <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                                        You have no reservation history.
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {history.map((reservation) => (
                                            <ReservationCard
                                                key={reservation.id}
                                                reservation={reservation}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    )}

                <AlertDialog
                    open={reservationToCancel !== null}
                    onOpenChange={(open) => {
                        if (!open && !isCancelling) {
                            setReservationToCancel(null);
                        }
                    }}
                >
                    {reservationToCancel && (
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                    Cancel this reservation?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    Your reservation with{' '}
                                    {reservationToCancel.barber.first_name}{' '}
                                    {reservationToCancel.barber.last_name} on{' '}
                                    {dateFormatter.format(
                                        new Date(reservationToCancel.starts_at),
                                    )}{' '}
                                    will be cancelled and its time slot will
                                    become available again.
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    disabled={isCancelling}
                                    className="cursor-pointer"
                                >
                                    Keep Reservation
                                </AlertDialogCancel>

                                <AlertDialogAction
                                    variant="destructive"
                                    className="cursor-pointer"
                                    disabled={isCancelling}
                                    onClick={(event) => {
                                        event.preventDefault();
                                        void handleCancel();
                                    }}
                                >
                                    {isCancelling ? (
                                        <LoaderCircle className="animate-spin" />
                                    ) : (
                                        <CalendarX2 />
                                    )}
                                    {isCancelling
                                        ? 'Cancelling...'
                                        : 'Cancel Reservation'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    )}
                </AlertDialog>
            </section>
        </>
    );
};

export default Index;
