import { Head, Link } from '@inertiajs/react';
import {
    CalendarClock,
    Clock3,
    Download,
    LoaderCircle,
    RefreshCw,
    StickyNote,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

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
import { ApiError, apiRequest } from '@/lib/api';
import DailyScheduleExport, {
    type ScheduleBarber,
    type ScheduleReservation,
    type ScheduleSlot,
} from '@/components/admin/daily-schedule-export';

type Props = {
    today: string;
    barbers: ScheduleBarber[];
};

type ScheduleResponse = {
    reservations: ScheduleReservation[];
};

type SlotStatus =
    'Reserved' | 'In progress' | 'Completed' | 'Available' | 'No reservation';

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
});

const statusClassNames: Record<SlotStatus, string> = {
    Reserved: 'border-transparent bg-primary text-primary-foreground',
    'In progress':
        'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
    Completed: 'border-transparent bg-secondary text-secondary-foreground',
    Available:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    'No reservation': 'border-transparent bg-secondary text-muted-foreground',
};

const getSlotStatus = (slot: ScheduleSlot, currentTime: number): SlotStatus => {
    if (slot.reservation) {
        if (slot.endsAt.getTime() <= currentTime) {
            return 'Completed';
        }

        if (slot.startsAt.getTime() <= currentTime) {
            return 'In progress';
        }

        return 'Reserved';
    }

    return slot.isElapsed ? 'No reservation' : 'Available';
};

const Index = ({ today, barbers }: Props) => {
    const defaultBarber =
        barbers.find((barber) => barber.is_active) ?? barbers[0];

    const [date, setDate] = useState(today);
    const [barberId, setBarberId] = useState(
        defaultBarber ? String(defaultBarber.id) : '',
    );
    const [reservations, setReservations] = useState<ScheduleReservation[]>([]);
    const [isLoading, setIsLoading] = useState(Boolean(defaultBarber));
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [currentTime, setCurrentTime] = useState(() => Date.now());

    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const selectedBarber = barbers.find(
        (barber) => String(barber.id) === barberId,
    );

    const selectedDate = date ? new Date(`${date}T00:00:00+08:00`) : null;

    const scheduleSlots = useMemo<ScheduleSlot[]>(() => {
        if (!date) {
            return [];
        }

        const reservationsByStartTime = new Map(
            reservations.map((reservation) => [
                new Date(reservation.starts_at).getTime(),
                reservation,
            ]),
        );

        return Array.from({ length: 12 }, (_, index) => {
            const hour = 9 + index;
            const startsAt = new Date(
                `${date}T${String(hour).padStart(2, '0')}:00:00+08:00`,
            );
            const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

            return {
                startsAt,
                endsAt,
                reservation:
                    reservationsByStartTime.get(startsAt.getTime()) ?? null,
                isElapsed: startsAt.getTime() <= currentTime,
            };
        });
    }, [currentTime, date, reservations]);

    useEffect(() => {
        if (!date || !barberId) {
            return;
        }

        const controller = new AbortController();

        const fetchSchedule = async () => {
            setIsLoading(true);
            setError(null);

            const parameters = new URLSearchParams({
                date,
                barber_id: barberId,
                status: 'confirmed',
            });

            try {
                const response = await apiRequest<ScheduleResponse>(
                    `/api/admin/reservations?${parameters.toString()}`,
                    {
                        signal: controller.signal,
                    },
                );

                setReservations(response.reservations);
                setCurrentTime(Date.now());
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                setError(
                    error instanceof ApiError
                        ? error.message
                        : 'Unable to load the daily schedule.',
                );
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        void fetchSchedule();

        return () => controller.abort();
    }, [date, barberId, refreshKey]);

    const handleDownloadPng = async () => {
        const exportElement = exportRef.current;

        if (!exportElement || !selectedBarber || !date) {
            return;
        }

        setIsExporting(true);

        try {
            await document.fonts.ready;

            const dataUrl = await toPng(exportElement, {
                backgroundColor: '#ffffff',
                cacheBust: true,
                pixelRatio: 1,
            });

            const barberSlug =
                `${selectedBarber.first_name}-${selectedBarber.last_name}`
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-|-$/g, '') ||
                `barber-${selectedBarber.id}`;

            const downloadLink = document.createElement('a');

            downloadLink.href = dataUrl;
            downloadLink.download =
                `${barberSlug}-${date}-daily-schedule.png`;

            downloadLink.click();

            toast.success('Daily schedule downloaded.');
        } catch {
            toast.error('Failed to download the daily schedule.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <Head title="Daily Schedule" />

            <section className="space-y-6 p-4">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Daily Schedule
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            View one barber's complete schedule for a selected
                            date.
                        </p>
                    </div>

                    <Button asChild variant="outline">
                        <Link href="/admin/barbers">
                            <UsersRound />
                            Manage Barbers
                        </Link>
                    </Button>
                </header>

                <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
                    <div className="space-y-2">
                        <Label htmlFor="schedule-date">Date</Label>
                        <Input
                            id="schedule-date"
                            type="date"
                            value={date}
                            onChange={(event) => setDate(event.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Barber</Label>
                        <Select
                            value={barberId || undefined}
                            disabled={barbers.length === 0}
                            onValueChange={setBarberId}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a barber" />
                            </SelectTrigger>
                            <SelectContent>
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

                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1 md:flex-none"
                            disabled={!date || !barberId || isLoading}
                            onClick={() => setRefreshKey((current) => current + 1)}
                        >
                            <RefreshCw
                                className={isLoading ? 'animate-spin' : undefined}
                            />
                            Refresh
                        </Button>

                        <Button
                            type="button"
                            className="flex-1 md:flex-none cursor-pointer"
                            disabled={
                                !selectedBarber ||
                                !selectedDate ||
                                isLoading ||
                                Boolean(error) ||
                                isExporting
                            }
                            onClick={handleDownloadPng}
                        >
                            <Download />
                            {isExporting ? 'Generating...' : 'Download PNG'}
                        </Button>
                    </div>
                </div>

                {selectedBarber && selectedDate && !isLoading && !error && (
                    <div
                        aria-hidden="true"
                        className="pointer-events-none fixed top-0 left-[-10000px]"
                    >
                        <DailyScheduleExport
                            ref={exportRef}
                            barber={selectedBarber}
                            date={selectedDate}
                            slots={scheduleSlots}
                            currentTime={currentTime}
                        />
                    </div>
                )}

                <div className="overflow-hidden rounded-lg border">
                    <div className="flex flex-col gap-4 border-b bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
                                <UserRound className="size-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="truncate font-semibold">
                                    {selectedBarber
                                        ? `${selectedBarber.first_name} ${selectedBarber.last_name}`
                                        : 'No barber selected'}
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    {selectedDate
                                        ? dateFormatter.format(selectedDate)
                                        : 'Select a date'}
                                </p>
                            </div>
                        </div>

                        {selectedBarber && !isLoading && !error && (
                            <p className="text-sm text-muted-foreground">
                                {reservations.length} of 12 slots reserved
                            </p>
                        )}
                    </div>

                    {!selectedBarber ? (
                        <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
                            <p className="mt-3 font-medium">
                                No barber available
                            </p>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                Add a barber before viewing a daily schedule.
                            </p>
                            <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="mt-4"
                            >
                                <Link href="/admin/barbers">View barbers</Link>
                            </Button>
                        </div>
                    ) : !date ? (
                        <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
                            <CalendarClock className="size-9 text-muted-foreground" />
                            <p className="mt-3 font-medium">Select a date</p>
                        </div>
                    ) : error ? (
                        <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
                            <CalendarClock className="size-9 text-destructive" />
                            <p className="mt-3 font-medium">
                                Schedule unavailable
                            </p>
                            <p className="mt-1 max-w-md text-sm text-muted-foreground">
                                {error}
                            </p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={() =>
                                    setRefreshKey((current) => current + 1)
                                }
                            >
                                <RefreshCw />
                                Try again
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <div aria-label="Loading daily schedule">
                            {Array.from({ length: 12 }, (_, index) => (
                                <div
                                    key={index}
                                    className="grid min-h-20 gap-3 border-b p-4 last:border-b-0 sm:grid-cols-[9rem_minmax(0,1fr)_7rem] sm:items-center"
                                >
                                    <Skeleton className="h-5 w-28" />
                                    <Skeleton className="h-9 w-full max-w-52" />
                                    <Skeleton className="h-6 w-24 sm:justify-self-end" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div>
                            {scheduleSlots.map((slot) => {
                                const status = getSlotStatus(slot, currentTime);

                                return (
                                    <div
                                        key={slot.startsAt.toISOString()}
                                        className="grid min-h-20 gap-3 border-b p-4 last:border-b-0 sm:grid-cols-[9rem_minmax(0,1fr)_7rem] sm:items-center"
                                    >
                                        <div className="flex w-xl items-center gap-2 text-sm font-medium">
                                            <Clock3 className="size-4 shrink-0 text-muted-foreground" />
                                            <span>
                                                {timeFormatter.format(
                                                    slot.startsAt,
                                                )}{' '}
                                                -{' '}
                                                {timeFormatter.format(
                                                    slot.endsAt,
                                                )}
                                            </span>
                                        </div>

                                        <div className="ml-8 min-w-0">
                                            {slot.reservation && (
                                                <>
                                                    <p className="truncate font-medium">
                                                        {
                                                            slot.reservation
                                                                .customer.name
                                                        }
                                                    </p>
                                                    {slot.reservation.notes && (
                                                        <div className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                                                            <StickyNote className="mt-0.5 size-3.5 shrink-0" />
                                                            <p className="line-clamp-2 wrap-break-word whitespace-pre-wrap">
                                                                {
                                                                    slot
                                                                        .reservation
                                                                        .notes
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <Badge
                                            variant="outline"
                                            className={`${statusClassNames[status]} justify-self-start sm:justify-self-end`}
                                        >
                                            {status}
                                        </Badge>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};

Index.layout = {
    breadcrumbs: [
        {
            title: 'Daily Schedule',
            href: '/admin/schedules',
        },
    ],
};

export default Index;
