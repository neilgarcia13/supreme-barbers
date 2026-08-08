import { Head } from '@inertiajs/react';

type Barber = {
  id: number;
  first_name: string;
  last_name: string;
  is_active: boolean;
};

type Props = {
  barbers: Barber[];
};

const Index = (_props: Props) => {
  return (
    <>
      <Head title="Reservations" />

      <section className="space-y-6 p-4">
        <header>
          <h1 className="text-2xl font-semibold">
            Reservations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage customer appointments.
          </p>
        </header>
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