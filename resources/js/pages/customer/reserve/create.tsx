import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MessageSquareText,
  UserRound,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TZDate } from 'react-day-picker';

import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, apiRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

type Barber = {
  id: number;
  first_name: string;
  last_name: string;
  photo_path: string | null;
};

type Props = {
  barber: Barber;
  max_reservation_date: string;
};

type SlotStatus = 'available' | 'reserved' | 'unavailable';

type AvailabilitySlot = {
  starts_at: string;
  ends_at: string;
  status: SlotStatus;
};

type AvailabilityResponse = {
  date: string;
  barber: {
    id: number;
    first_name: string;
    last_name: string;
  };
  slots: AvailabilitySlot[];
};

type CreateReservationResponse = {
  message: string;
  reservation: {
    id: number;
    starts_at: string;
    ends_at: string;
    status: 'confirmed';
    barber: Barber;
  };
};

const SHOP_TIME_ZONE = 'Asia/Manila';

const parseShopDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);

  return new TZDate(
    year,
    month - 1,
    day,
    SHOP_TIME_ZONE,
  );
};

const slotTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: SHOP_TIME_ZONE,
});

const slotStatusLabels: Record<SlotStatus, string> = {
  available: 'Available',
  reserved: 'Reserved',
  unavailable: 'Unavailable',
};

const Create = ({ barber, max_reservation_date }: Props) => {
  const fullName = `${barber.first_name} ${barber.last_name}`;
  const today = TZDate.tz(SHOP_TIME_ZONE);
  const maxReservationDate = parseShopDate(
    max_reservation_date,
  );

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() =>
    TZDate.tz(SHOP_TIME_ZONE),
  );
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedStartsAt, setSelectedStartsAt] = useState<string | null>(
    null,
  );
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const requestController = useRef<AbortController | null>(null);

  const fetchAvailability = useCallback(async () => {
    requestController.current?.abort();

    if (!selectedDate) {
      setSlots([]);
      setAvailabilityError(null);
      setIsAvailabilityLoading(false);

      return;
    }

    const controller = new AbortController();
    requestController.current = controller;

    setIsAvailabilityLoading(true);
    setAvailabilityError(null);

    try {
      const date = format(selectedDate, 'yyyy-MM-dd');
      const query = new URLSearchParams({ date });

      const response = await fetch(
        `/api/barbers/${barber.id}/availability?${query.toString()}`,
        {
          headers: {
            Accept: 'application/json',
          },
          credentials: 'same-origin',
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error('Failed to fetch availability.');
      }

      const result = (await response.json()) as AvailabilityResponse;

      setSlots(result.slots);
      setSelectedStartsAt((currentSelection) => {
        const isStillAvailable = result.slots.some(
          (slot) =>
            slot.starts_at === currentSelection &&
            slot.status === 'available',
        );

        return isStillAvailable ? currentSelection : null;
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      setSlots([]);
      setAvailabilityError(
        'Unable to load available times. Please try again.',
      );
    } finally {
      if (!controller.signal.aborted) {
        setIsAvailabilityLoading(false);
      }
    }
  }, [barber.id, selectedDate]);

  useEffect(() => {
    const initialFetchTimer = window.setTimeout(() => {
      void fetchAvailability();
    }, 0);

    const handleFocus = () => {
      void fetchAvailability();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.clearTimeout(initialFetchTimer);
      window.removeEventListener('focus', handleFocus);
      requestController.current?.abort();
    };
  }, [fetchAvailability]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedStartsAt(null);
    setSubmissionError(null);
  };

  const formatSlotTime = (startsAt: string) =>
    slotTimeFormatter.format(new Date(startsAt));

  const availableSlotCount = slots.filter(
    (slot) => slot.status === 'available',
  ).length;

  const handleReserve = async () => {
    if (isSubmitting) {
      return;
    }

    if (!selectedStartsAt) {
      setSubmissionError('Select an available reservation time.');

      return;
    }

    const normalizedNotes = notes.trim();

    if (normalizedNotes.length > 1000) {
      setSubmissionError('Notes must not exceed 1000 characters.');

      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await apiRequest<CreateReservationResponse>(
        '/api/reservations',
        {
          method: 'POST',
          json: {
            barber_id: barber.id,
            starts_at: selectedStartsAt,
            notes: normalizedNotes || null,
          },
        },
      );

      toast.success(result.message);

      setNotes('');
      setSelectedStartsAt(null);

      await fetchAvailability();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setSelectedStartsAt(null);
          setSubmissionError(
            error.payload.errors?.starts_at?.[0] ?? error.message,
          );

          await fetchAvailability();

          return;
        }

        if (error.status === 422) {
          const firstValidationError = Object.values(
            error.payload.errors ?? {},
          ).flat()[0];

          setSubmissionError(
            firstValidationError ??
            'Check the reservation information and try again.',
          );

          return;
        }

        setSubmissionError(error.message);

        return;
      }

      setSubmissionError(
        'Unable to confirm the reservation. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head title={`Reserve with ${fullName}`} />

      <section className="space-y-8">
        <header>
          <h1 className="mt-2 text-2xl font-semibold">
            Reserve with {fullName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Choose a date and an available one-hour reservation
            time.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)] lg:items-start">
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b pb-5">
              <div className="size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {barber.photo_path ? (
                  <img
                    src={`/storage/${barber.photo_path}`}
                    alt={fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserRound className="size-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  Your barber
                </p>
                <p className="truncate font-semibold">
                  {fullName}
                </p>
              </div>
            </div>

            <section
              aria-labelledby="date-selection-heading"
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <h2
                  id="date-selection-heading"
                  className="font-semibold"
                >
                  Select a date
                </h2>
              </div>

              <p className="text-sm text-muted-foreground">
                Reservations are available through{' '}
                {format(maxReservationDate, 'MMMM d, yyyy')}.
              </p>

              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={[
                  { before: today },
                  { after: maxReservationDate },
                ]}
                startMonth={today}
                endMonth={maxReservationDate}
                timeZone={SHOP_TIME_ZONE}
                className="w-full rounded-lg border [--cell-size:--spacing(10)]"
              />
            </section>
          </div>

          <section
            aria-labelledby="time-selection-heading"
            className="space-y-5 lg:border-l lg:pl-8"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-muted-foreground" />
                  <h2
                    id="time-selection-heading"
                    className="font-semibold"
                  >
                    Select a time
                  </h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedDate
                    ? format(
                      selectedDate,
                      'EEEE, MMMM d, yyyy',
                    )
                    : 'Choose a date to view availability'}
                </p>
              </div>

              {!isAvailabilityLoading &&
                !availabilityError &&
                slots.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {availableSlotCount}{' '}
                    {availableSlotCount === 1
                      ? 'time'
                      : 'times'}{' '}
                    available
                  </p>
                )}
            </div>

            {isAvailabilityLoading && (
              <div
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4"
                aria-label="Loading available times"
                aria-busy="true"
              >
                {Array.from({ length: 12 }).map((_, index) => (
                  <Skeleton
                    key={index}
                    className="h-16 w-full rounded-md"
                  />
                ))}
              </div>
            )}

            {!isAvailabilityLoading && availabilityError && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>
                  Failed to load available times. Please try
                  again.
                </AlertTitle>
                <AlertDescription className="gap-3">
                  <p>{availabilityError}</p>
                </AlertDescription>
              </Alert>
            )}

            {!isAvailabilityLoading &&
              !availabilityError &&
              !selectedDate && (
                <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Select a date to see available
                    reservation times.
                  </p>
                </div>
              )}

            {!isAvailabilityLoading &&
              !availabilityError &&
              selectedDate &&
              slots.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {slots.map((slot) => {
                    const isAvailable =
                      slot.status === 'available';
                    const isSelected =
                      slot.starts_at === selectedStartsAt;

                    return (
                      <Button
                        key={slot.starts_at}
                        type="button"
                        variant={
                          isSelected
                            ? 'default'
                            : 'outline'
                        }
                        disabled={!isAvailable}
                        aria-pressed={isSelected}
                        aria-label={`${formatSlotTime(slot.starts_at)} ${slotStatusLabels[slot.status]}`}
                        onClick={() => {
                          setSelectedStartsAt(
                            slot.starts_at,
                          );
                          setSubmissionError(null);
                        }}
                        className={cn(
                          'h-16 w-full flex-col gap-1 px-2 whitespace-normal disabled:opacity-100',
                          slot.status ===
                          'reserved' &&
                          'border-dashed bg-muted/70 text-muted-foreground dark:bg-muted/40',
                          slot.status ===
                          'unavailable' &&
                          'border-transparent bg-muted/30 text-muted-foreground',
                        )}
                      >
                        <span className="text-sm font-medium">
                          {formatSlotTime(
                            slot.starts_at,
                          )}
                        </span>
                        <span
                          className={cn(
                            'text-xs font-normal',
                            isSelected
                              ? 'text-primary-foreground/75'
                              : isAvailable
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-muted-foreground',
                          )}
                        >
                          {
                            slotStatusLabels[
                            slot.status
                            ]
                          }
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}

            {!isAvailabilityLoading &&
              !availabilityError &&
              selectedDate &&
              slots.length === 0 && (
                <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No reservation times are available for
                    this date.
                  </p>
                </div>
              )}

            <div className="flex flex-col gap-2 border-t pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-muted-foreground">
                Times shown in Asia/Manila.
              </p>

              {selectedStartsAt && (
                <p>
                  Selected:{' '}
                  <span className="font-semibold">
                    {formatSlotTime(selectedStartsAt)}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-5 pt-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <Label
                    htmlFor="reservation-notes"
                    className="flex items-center gap-2"
                  >
                    <MessageSquareText className="size-4 text-muted-foreground" />
                    Notes
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </Label>

                  <span className="text-xs text-muted-foreground">
                    {notes.length}/1000
                  </span>
                </div>

                <Textarea
                  id="reservation-notes"
                  value={notes}
                  maxLength={1000}
                  rows={4}
                  disabled={isSubmitting}
                  placeholder="Add any requests or details for your barber."
                  className="min-h-24 resize-y"
                  onChange={(event) => {
                    setNotes(event.target.value);
                    setSubmissionError(null);
                  }}
                />
              </div>

              {submissionError && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertTitle>
                    Failed to confirm reservation. Please try again.
                  </AlertTitle>
                  <AlertDescription>
                    {submissionError}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  size="lg"
                  disabled={
                    !selectedStartsAt ||
                    isSubmitting ||
                    isAvailabilityLoading
                  }
                  className="w-full sm:w-auto cursor-pointer"
                  onClick={() => void handleReserve()}
                >
                  {isSubmitting
                    ? 'Confirming Reservation'
                    : 'Confirm Reservation'}
                </Button>
              </div>
            </div>
          </section>
        </div>
      </section>
    </>
  );
};

Create.layout = ({ barber }: Props) => ({
  breadcrumbs: [
    {
      title: 'Reserve',
      href: '/reserve',
    },
    {
      title: `${barber.first_name} ${barber.last_name}`,
      href: `/reserve/${barber.id}`,
    },
  ],
});

export default Create;
