import { Head } from '@inertiajs/react';
import { Search, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ApiError, apiRequest } from '@/lib/api';

type Barber = {
    id: number;
    first_name: string;
    last_name: string;
    is_active: boolean;
};

type Props = {
    barbers: Barber[];
};

type ReservationCustomer = {
    id: number;
    name: string;
    email: string;
};

type ReservationBarber = Barber & {
    photo_path: string | null;
};

type AdminReservation = {
    id: number;
    starts_at: string;
    ends_at: string;
    status: 'confirmed' | 'cancelled';
    notes: string | null;
    cancelled_at: string | null;
    customer: ReservationCustomer;
    barber: ReservationBarber;
};

type ReservationsResponse = {
    reservations: AdminReservation[];
};

type StatusFilter = 'all' | 'confirmed' | 'cancelled';

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

type DisplayStatus = 'Confirmed' | 'In progress' | 'Completed' | 'Cancelled';

const getDisplayStatus = (reservation: AdminReservation): DisplayStatus => {
    if (reservation.status === 'cancelled') {
        return 'Cancelled';
    }

    const now = Date.now();
    const startsAt = new Date(reservation.starts_at).getTime();
    const endsAt = new Date(reservation.ends_at).getTime();

    if (startsAt > now) {
        return 'Confirmed';
    }

    if (endsAt > now) {
        return 'In progress';
    }

    return 'Completed';
};

const Index = ({ barbers }: Props) => {
    const [reservations, setReservations] = useState<AdminReservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    //Filter states
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [date, setDate] = useState('');
    const [barberId, setBarberId] = useState('all');
    const [status, setStatus] = useState<StatusFilter>('all');

    const hasFilters =
        searchInput.trim() !== '' ||
        search !== '' ||
        date !== '' ||
        barberId !== 'all' ||
        status !== 'all';

    const clearFilters = () => {
        setSearchInput('');
        setSearch('');
        setDate('');
        setBarberId('all');
        setStatus('all');
    };

    useEffect(() => {
        const controller = new AbortController();

        const parameters = new URLSearchParams();

        if (search) {
            parameters.set('search', search);
        }

        if (date) {
            parameters.set('date', date);
        }

        if (barberId !== 'all') {
            parameters.set('barber_id', barberId);
        }

        if (status !== 'all') {
            parameters.set('status', status);
        }

        const query = parameters.toString();
        const url = `/api/admin/reservations${query ? `?${query}` : ''}`;

        const fetchReservations = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await apiRequest<ReservationsResponse>(url, {
                    signal: controller.signal,
                });

                setReservations(response.reservations);
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                setError(
                    error instanceof ApiError
                        ? error.message
                        : 'Failed to load reservations.',
                );
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        void fetchReservations();

        return () => controller.abort();
    }, [search, date, barberId, status]);

    return (
        <>
            <Head title="Reservations" />

            <section className="space-y-6 p-4">
                <header>
                    <h1 className="text-2xl font-semibold">Reservations</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        View and manage customer reservations.
                    </p>
                </header>

                <div className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[minmax(14rem,1fr)_12rem_14rem_12rem_auto] lg:items-end">
                    <form
                        className="space-y-2"
                        onSubmit={(event) => {
                            event.preventDefault();
                            setSearch(searchInput.trim());
                        }}
                    >
                        <Label htmlFor="reservation-search">Customer</Label>
                        <div className="relative">
                            <Input
                                id="reservation-search"
                                value={searchInput}
                                placeholder="Search name or email"
                                className="pr-10"
                                onChange={(event) =>
                                    setSearchInput(event.target.value)
                                }
                            />
                            <Button
                                type="submit"
                                variant="link"
                                size="icon"
                                className="absolute top-1/2 right-1 -translate-y-1/2"
                                aria-label="Search reservations"
                            >
                                <Search />
                            </Button>
                        </div>
                    </form>

                    <div className="space-y-2">
                        <Label htmlFor="reservation-date">Date</Label>
                        <Input
                            id="reservation-date"
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Barber</Label>
                        <Select value={barberId} onValueChange={setBarberId}>
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All barbers</SelectItem>

                                {barbers.map((barber) => (
                                    <SelectItem
                                        key={barber.id}
                                        value={String(barber.id)}
                                    >
                                        {barber.first_name} {barber.last_name}
                                        {!barber.is_active && ' (Inactive)'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                            value={status}
                            onValueChange={(value: StatusFilter) =>
                                setStatus(value)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All statuses
                                </SelectItem>
                                <SelectItem value="confirmed">
                                    Confirmed
                                </SelectItem>
                                <SelectItem value="cancelled">
                                    Cancelled
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        disabled={!hasFilters}
                        onClick={clearFilters}
                    >
                        Clear filters
                    </Button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold">Reservation Records</h2>

                        {!isLoading && !error && (
                            <p className="text-sm text-muted-foreground">
                                {reservations.length}{' '}
                                {reservations.length === 1
                                    ? 'reservation'
                                    : 'reservations'}
                            </p>
                        )}
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <div className="overflow-hidden rounded-lg border">
                        <div className="overflow-x-auto">
                            <Table className="min-w-180">
                                <TableCaption className="sr-only">
                                    Customer reservation records
                                </TableCaption>

                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-52">
                                            Date and time
                                        </TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Barber</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="hidden xl:table-cell">
                                            Notes
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {isLoading &&
                                        Array.from({ length: 5 }).map(
                                            (_, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Skeleton className="h-9 w-36" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton className="h-9 w-40" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton className="h-9 w-32" />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Skeleton className="h-6 w-20" />
                                                    </TableCell>
                                                    <TableCell className="hidden xl:table-cell">
                                                        <Skeleton className="h-9 w-44" />
                                                    </TableCell>
                                                </TableRow>
                                            ),
                                        )}

                                    {!isLoading &&
                                        !error &&
                                        reservations.map((reservation) => {
                                            const startsAt = new Date(
                                                reservation.starts_at,
                                            );
                                            const endsAt = new Date(
                                                reservation.ends_at,
                                            );
                                            const displayStatus =
                                                getDisplayStatus(reservation);
                                            const barberName = `${reservation.barber.first_name} ${reservation.barber.last_name}`;

                                            return (
                                                <TableRow key={reservation.id}>
                                                    <TableCell>
                                                        <p className="font-medium">
                                                            {dateFormatter.format(
                                                                startsAt,
                                                            )}
                                                        </p>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            {timeFormatter.format(
                                                                startsAt,
                                                            )}
                                                            {' - '}
                                                            {timeFormatter.format(
                                                                endsAt,
                                                            )}
                                                        </p>
                                                    </TableCell>

                                                    <TableCell>
                                                        <p className="font-medium">
                                                            {
                                                                reservation
                                                                    .customer
                                                                    .name
                                                            }
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {
                                                                reservation
                                                                    .customer
                                                                    .email
                                                            }
                                                        </p>
                                                    </TableCell>

                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="size-9 rounded-md">
                                                                {reservation
                                                                    .barber
                                                                    .photo_path && (
                                                                    <AvatarImage
                                                                        src={`/storage/${reservation.barber.photo_path}`}
                                                                        alt={
                                                                            barberName
                                                                        }
                                                                        className="object-cover"
                                                                    />
                                                                )}
                                                                <AvatarFallback className="rounded-md">
                                                                    <UserRound className="size-4" />
                                                                </AvatarFallback>
                                                            </Avatar>

                                                            <span className="font-medium">
                                                                {barberName}
                                                            </span>
                                                        </div>
                                                    </TableCell>

                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                displayStatus ===
                                                                'Cancelled'
                                                                    ? 'destructive'
                                                                    : displayStatus ===
                                                                        'Confirmed'
                                                                      ? 'default'
                                                                      : 'secondary'
                                                            }
                                                        >
                                                            {displayStatus}
                                                        </Badge>
                                                    </TableCell>

                                                    <TableCell className="hidden max-w-64 xl:table-cell">
                                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                                            {reservation.notes ??
                                                                'No notes'}
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}

                                    {!isLoading &&
                                        !error &&
                                        reservations.length === 0 && (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={5}
                                                    className="h-56 text-center"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <p className="mt-3 text-lg font-medium">
                                                            No reservations
                                                            found
                                                        </p>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            Try adjusting the
                                                            current filters.
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

Index.layout = {
    breadcrumbs: [
        {
            title: 'Reservations',
            href: '/admin/reservations',
        },
    ],
};

export default Index;
