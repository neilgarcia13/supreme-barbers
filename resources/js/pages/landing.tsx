import { Head, Link, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    Clock3,
    Menu,
    Moon,
    Sun,
    Timer,
    UserRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogo from '@/components/app-logo';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard, home, login, register } from '@/routes';

type Barber = {
    id: number;
    first_name: string;
    last_name: string;
    photo_path: string | null;
};

type BarberResponse = {
    barbers: Barber[];
};

const navigation = [
    { label: 'Available Barbers', href: '#available-barbers' },
    { label: 'How It Works', href: '#how-it-works' },
];

const reservationSteps = [
    {
        number: '01',
        title: 'Check availability',
        description:
            'See which barbers are currently available before visiting the shop.',
    },
    {
        number: '02',
        title: 'Choose your barber',
        description:
            'Select your preferred barber and review their open reservation times.',
    },
    {
        number: '03',
        title: 'Reserve your time',
        description:
            'Confirm a one-hour reservation and receive the details by email.',
    },
];

const Landing = () => {
    const { auth } = usePage().props;
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const heroHref = auth.user ? dashboard() : register();
    const heroLabel =
        auth.user?.role === 'admin'
            ? 'Open Admin Dashboard'
            : 'Reserve Your Barber';
    const isDark = resolvedAppearance === 'dark';
    const themeLabel = isDark ? 'Switch to light mode' : 'Switch to dark mode';

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

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
            <div className="min-h-screen bg-background text-foreground">
                <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <Link
                            href={home()}
                            className="flex min-w-0 items-center transition-opacity hover:opacity-80"
                            aria-label="Supreme Barbers home"
                        >
                            <AppLogo />
                        </Link>

                        <nav
                            className="hidden items-center gap-8 md:flex"
                            aria-label="Main navigation"
                        >
                            {navigation.map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    {item.label}
                                </a>
                            ))}
                        </nav>

                        <div className="hidden items-center gap-2 md:flex">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href={dashboard()}>
                                        Open Dashboard
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button variant="ghost" asChild>
                                        <Link href={login()}>Log In</Link>
                                    </Button>

                                    <Button asChild>
                                        <Link href={register()}>Sign Up</Link>
                                    </Button>
                                </>
                            )}

                            <div className="ml-4">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                    aria-label={themeLabel}
                                    title={themeLabel}
                                >
                                    {isDark ? <Sun /> : <Moon />}
                                </Button>
                            </div>
                        </div>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden"
                                    aria-label="Open navigation menu"
                                >
                                    <Menu />
                                </Button>
                            </SheetTrigger>

                            <SheetContent side="right">
                                <SheetHeader>
                                    <SheetTitle>Supreme Barbers</SheetTitle>
                                </SheetHeader>

                                <nav
                                    className="flex flex-col gap-2 px-4"
                                    aria-label="Mobile navigation"
                                >
                                    {navigation.map((item) => (
                                        <SheetClose asChild key={item.href}>
                                            <a
                                                href={item.href}
                                                className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                                            >
                                                {item.label}
                                            </a>
                                        </SheetClose>
                                    ))}
                                </nav>

                                <div className="mt-auto grid gap-2 px-4 pb-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={toggleTheme}
                                    >
                                        {isDark ? <Sun /> : <Moon />}
                                        {themeLabel}
                                    </Button>

                                    {auth.user ? (
                                        <Button asChild>
                                            <Link href={dashboard()}>
                                                Open Dashboard
                                            </Link>
                                        </Button>
                                    ) : (
                                        <>
                                            <Button variant="outline" asChild>
                                                <Link href={login()}>
                                                    Log In
                                                </Link>
                                            </Button>

                                            <Button asChild>
                                                <Link href={register()}>
                                                    Sign Up
                                                </Link>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </header>

                <main>
                    <section className="relative flex min-h-[calc(100svh-8rem)] items-end overflow-hidden bg-neutral-950 text-white">
                        <img
                            src="/images/landing/landing-hero.jpg"
                            alt="Supreme Barbers shop interior"
                            className="absolute inset-0 size-full object-cover"
                            fetchPriority="high"
                        />
                        <div className="absolute inset-0 bg-black/60" />

                        <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
                            <div className="max-w-3xl">
                                <div className="mb-5 flex items-center gap-3">
                                    <img
                                        src="/images/brand/supreme-barbers-logo-dark.webp"
                                        alt=""
                                        aria-hidden="true"
                                        className="size-10 shrink-0 object-contain"
                                    />
                                    <p className="text-sm font-semibold">
                                        Supreme Barbers
                                    </p>
                                </div>

                                <h1 className="text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
                                    Know who's in. Reserve your preferred
                                    barber.
                                </h1>

                                <p className="mt-6 max-w-2xl text-base leading-7 text-neutral-200 sm:text-lg">
                                    Check which barbers are available, choose
                                    your preferred barber, and reserve a
                                    one-hour reservation before visiting the
                                    shop.
                                </p>

                                <Button size="lg" className="mt-8" asChild>
                                    <Link href={heroHref}>{heroLabel}</Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    <section
                        id="available-barbers"
                        className="scroll-mt-16 border-b py-20 sm:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] lg:gap-16">
                                <div className="max-w-2xl">
                                    <p className="text-sm font-semibold text-primary">
                                        Available Barbers
                                    </p>

                                    <h2 className="mt-2 text-3xl font-semibold">
                                        See who's ready for your next cut
                                    </h2>

                                    <p className="mt-4 leading-7 text-muted-foreground">
                                        Availability is maintained by the shop
                                        so you can check before making the trip.
                                    </p>

                                    {!isLoading &&
                                        !error &&
                                        barbers.length > 0 && (
                                            <p className="mt-6 text-sm font-medium text-foreground">
                                                {barbers.length}{' '}
                                                {barbers.length === 1
                                                    ? 'barber'
                                                    : 'barbers'}{' '}
                                                currently available
                                            </p>
                                        )}
                                </div>

                                <div className="group w-full max-w-xl justify-self-end overflow-hidden rounded-lg border bg-muted shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:shadow-black/30 dark:hover:shadow-black/40">
                                    <img
                                        src="/images/landing/landing-barber-service.jpg"
                                        alt="A barber preparing a customer for a haircut"
                                        className="aspect-3/2 size-full object-cover"
                                        loading="lazy"
                                    />
                                </div>
                            </div>

                            {isLoading && (
                                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {Array.from({ length: 3 }).map(
                                        (_, index) => (
                                            <Card
                                                key={index}
                                                className="gap-0 overflow-hidden rounded-lg py-0"
                                            >
                                                <Skeleton className="aspect-4/3 w-full rounded-none" />
                                                <div className="space-y-3 p-5">
                                                    <Skeleton className="h-5 w-2/3" />
                                                    <Skeleton className="h-5 w-24" />
                                                </div>
                                            </Card>
                                        ),
                                    )}
                                </div>
                            )}

                            {!isLoading && error && (
                                <Alert
                                    variant="destructive"
                                    className="mt-10 rounded-lg"
                                >
                                    <AlertCircle />
                                    <AlertTitle>
                                        Unable to load available barbers
                                    </AlertTitle>
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {!isLoading && !error && barbers.length === 0 && (
                                <div className="mt-10 rounded-lg border border-dashed bg-muted/30 p-8 text-center">
                                    <h3 className="font-semibold">
                                        No barbers are currently available
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Please check again later for updated
                                        availability.
                                    </p>
                                </div>
                            )}

                            {!isLoading && !error && barbers.length > 0 && (
                                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                    {barbers.map((barber) => (
                                        <Card
                                            key={barber.id}
                                            className="group gap-0 overflow-hidden rounded-lg py-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                                        >
                                            <div className="aspect-4/3 overflow-hidden bg-muted">
                                                {barber.photo_path ? (
                                                    <img
                                                        src={`/storage/${barber.photo_path}`}
                                                        alt={`${barber.first_name} ${barber.last_name}`}
                                                        className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="flex size-full items-center justify-center">
                                                        <UserRound className="size-20 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            <CardHeader className="flex-row items-center justify-between gap-4 p-5">
                                                <CardTitle className="text-lg leading-snug">
                                                    {barber.first_name}{' '}
                                                    {barber.last_name}
                                                </CardTitle>
                                                <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                                    <span className="size-1.5 rounded-full bg-emerald-500" />
                                                    Available
                                                </Badge>
                                            </CardHeader>
                                        </Card>
                                    ))}
                                </div>
                            )}
                            <Button asChild size="lg" className="mt-4 w-full">
                                <Link href={heroHref}>{heroLabel}</Link>
                            </Button>
                        </div>
                    </section>

                    <section
                        id="how-it-works"
                        className="scroll-mt-16 bg-muted/40 py-20 sm:py-24"
                    >
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid items-center gap-12 lg:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
                                <div className="group w-full max-w-xl overflow-hidden rounded-lg border bg-muted shadow-xl">
                                    <img
                                        src="/images/landing/landing-shop-interior.jpg"
                                        alt="The barber chairs inside the shop"
                                        className="aspect-4/3 size-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                                        loading="lazy"
                                    />
                                </div>

                                <div>
                                    <div className="max-w-2xl">
                                        <p className="text-sm font-semibold text-primary">
                                            How It Works
                                        </p>

                                        <h2 className="mt-2 text-3xl font-semibold">
                                            Plan your visit in three steps
                                        </h2>
                                    </div>

                                    <div className="mt-10 grid gap-8">
                                        {reservationSteps.map((step) => (
                                            <div
                                                key={step.number}
                                                className="group grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-t border-border pt-5 transition-colors hover:border-primary/60"
                                            >
                                                <span className="text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-1">
                                                    {step.number}
                                                </span>

                                                <div>
                                                    <h3 className="text-xl font-semibold transition-colors group-hover:text-primary">
                                                        {step.title}
                                                    </h3>

                                                    <p className="mt-2 leading-7 text-muted-foreground">
                                                        {step.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border-y py-16">
                        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
                            <div className="group flex items-end gap-4">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                    <Clock3 className="size-5" />
                                </span>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Operating hours
                                    </p>
                                    <p className="mt-1 font-semibold">
                                        9:00 AM - 9:00 PM
                                    </p>
                                </div>
                            </div>

                            <div className="group flex items-end gap-4">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                    <Timer className="size-5" />
                                </span>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Reservation duration
                                    </p>
                                    <p className="mt-1 font-semibold">
                                        One hour
                                    </p>
                                </div>
                            </div>

                            <div className="group flex items-end gap-4">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                                    <CalendarDays className="size-5" />
                                </span>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Reservation window
                                    </p>
                                    <p className="mt-1 font-semibold">
                                        Up to 30 days ahead
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="bg-muted/30">
                    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                        <Link
                            href={home()}
                            className="flex min-w-0 items-center transition-opacity hover:opacity-80"
                            aria-label="Supreme Barbers home"
                        >
                            <AppLogo />
                        </Link>

                        <div className="text-sm text-muted-foreground sm:text-right">
                            <p className="mt-1">
                                &copy; {new Date().getFullYear()} Supreme
                                Barbers. All rights reserved.
                            </p>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default Landing;
