import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '@/lib/api';

import { Search, X } from 'lucide-react';

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
          <h1 className="text-2xl font-semibold">
            Reservations
          </h1>
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
                variant="ghost"
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
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={!hasFilters}
            onClick={clearFilters}
          >
            <X />
            Clear
          </Button>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Loading reservations...</p>}

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        {!isLoading && !error && (
          <p className="text-sm text-muted-foreground">
            {reservations.length} reservations
          </p>
        )}
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