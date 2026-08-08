import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';
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

const Index = (_props: Props) => {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchReservations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await apiRequest<ReservationsResponse>(
          '/api/admin/reservations',
          {
            signal: controller.signal,
          },
        );

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
  }, []);
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