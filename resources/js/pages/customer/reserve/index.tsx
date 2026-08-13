import { Head, Link } from '@inertiajs/react';
import { AlertCircle, ArrowRight, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Barber = {
    id: number;
    first_name: string;
    last_name: string;
    photo_path: string | null;
};

type BarberResponse = {
    barbers: Barber[];
};

const Index = () => {
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchBarbers = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/barbers', {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch barbers.');
                }

                const result = (await response.json()) as BarberResponse;

                setBarbers(result.barbers);
            } catch (error) {
                if (
                    error instanceof DOMException &&
                    error.name === 'AbortError'
                ) {
                    return;
                }

                setError('Please check your connection and try again.');
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        void fetchBarbers();

        return () => {
            controller.abort();
        };
    }, []);

    return (
        <>
            <Head title="Reserve" />

            <section className="space-y-8">
                <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">
                            Reservation
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold">
                            Choose your barber
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            Select an active barber to view available dates and
                            one-hour appointment times.
                        </p>
                    </div>

                    {!isLoading && !error && barbers.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                            {barbers.length}{' '}
                            {barbers.length === 1 ? 'barber' : 'barbers'}{' '}
                            available
                        </p>
                    )}
                </header>

                {isLoading && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Card
                                key={index}
                                className="gap-0 overflow-hidden rounded-lg py-0"
                            >
                                <Skeleton className="aspect-4/3 w-full rounded-none" />
                                <div className="space-y-4 p-5">
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-2/3" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                    <Skeleton className="h-9 w-full" />
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {!isLoading && error && (
                    <Alert variant="destructive" className="rounded-lg">
                        <AlertCircle />
                        <AlertTitle>
                            Failed to load barbers. Please try again.
                        </AlertTitle>
                        <AlertDescription>
                            <p>{error}</p>
                        </AlertDescription>
                    </Alert>
                )}

                {!isLoading && !error && barbers.length === 0 && (
                    <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                        <h2 className="mt-4 font-semibold">
                            No barbers are currently available
                        </h2>
                        <p className="mt-1 max-w-md text-sm text-muted-foreground">
                            Please check again later for available barbers.
                        </p>
                    </div>
                )}

                {!isLoading && !error && barbers.length > 0 && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {barbers.map((barber) => (
                            <Card
                                key={barber.id}
                                className="group h-full overflow-hidden rounded-lg py-0 hover:border-foreground/20 hover:shadow-md"
                            >
                                <div className="aspect-4/3 overflow-hidden bg-muted">
                                    {barber.photo_path ? (
                                        <img
                                            src={`/storage/${barber.photo_path}`}
                                            alt={`${barber.first_name} ${barber.last_name}`}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center">
                                            <UserRound className="size-20 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                <CardHeader className="gap-3 px-5 pt-5 pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <CardTitle className="text-lg leading-snug">
                                            {barber.first_name}{' '}
                                            {barber.last_name}
                                        </CardTitle>
                                        <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                            <span className="size-1.5 rounded-full bg-emerald-500" />
                                            Available
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        View available dates and select your
                                        preferred appointment time.
                                    </CardDescription>
                                </CardHeader>

                                <CardFooter className="mt-auto px-5 pt-2 pb-5">
                                    <Button asChild className="w-full">
                                        <Link href={`/reserve/${barber.id}`}>
                                            Choose Barber
                                            <ArrowRight />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
};

export default Index;
