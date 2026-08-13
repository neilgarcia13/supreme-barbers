import { Head, Link, useForm } from '@inertiajs/react';
import { UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SubmitEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

type Barber = {
    id: number;
    first_name: string;
    last_name: string;
    birthdate: string;
    photo_path: string | null;
    is_active: boolean;
};

type Props = {
    barber: Barber;
};

const shopDateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'Asia/Manila',
});

const calculateAge = (birthdate: string) => {
    if (!birthdate) {
        return '';
    }

    const [birthYear, birthMonth, birthDay] = birthdate.split('-').map(Number);
    const todayParts = shopDateFormatter.formatToParts(new Date());
    const getTodayPart = (type: Intl.DateTimeFormatPartTypes) =>
        Number(todayParts.find((part) => part.type === type)?.value);
    const currentYear = getTodayPart('year');
    const currentMonth = getTodayPart('month');
    const currentDay = getTodayPart('day');

    let age = currentYear - birthYear;

    if (
        currentMonth < birthMonth ||
        (currentMonth === birthMonth && currentDay < birthDay)
    ) {
        age -= 1;
    }

    return age.toString();
};

const Edit = ({ barber }: Props) => {
    const existingPhotoUrl = barber.photo_path
        ? `/storage/${barber.photo_path}`
        : null;
    const [selectedPhotoPreview, setSelectedPhotoPreview] = useState<
        string | null
    >(null);
    const { data, setData, post, processing, errors } = useForm({
        _method: 'put',
        first_name: barber.first_name,
        last_name: barber.last_name,
        birthdate: barber.birthdate,
        photo_path: null as File | null,
        is_active: barber.is_active,
    });

    useEffect(() => {
        return () => {
            if (selectedPhotoPreview) {
                URL.revokeObjectURL(selectedPhotoPreview);
            }
        };
    }, [selectedPhotoPreview]);

    const handleSubmit = (event: SubmitEvent) => {
        event.preventDefault();
        post(`/admin/barbers/${barber.id}`, {
            forceFormData: true,
        });
    };

    const fullName = `${barber.first_name} ${barber.last_name}`;
    const age = calculateAge(data.birthdate);
    const photoPreview = selectedPhotoPreview ?? existingPhotoUrl;

    return (
        <>
            <Head title="Edit Barber" />

            <section className="space-y-6 p-4">
                <header className="flex items-start gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold">Edit Barber</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Update {fullName}&apos;s profile and availability.
                        </p>
                    </div>
                </header>

                <form
                    onSubmit={handleSubmit}
                    className="overflow-hidden rounded-lg border"
                >
                    <div className="grid lg:grid-cols-[16rem_minmax(0,1fr)]">
                        <aside className="border-b bg-muted/20 p-5 lg:border-r lg:border-b-0">
                            <div className="mx-auto w-full max-w-64 lg:max-w-none">
                                <Label htmlFor="photo_path">
                                    Profile photo
                                </Label>

                                <div className="mt-3 aspect-square overflow-hidden rounded-md border bg-muted">
                                    {photoPreview ? (
                                        <img
                                            src={photoPreview}
                                            alt={`${fullName} profile preview`}
                                            className="size-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex size-full items-center justify-center">
                                            <UserRound className="size-20 text-muted-foreground/60" />
                                        </div>
                                    )}
                                </div>

                                <Input
                                    id="photo_path"
                                    name="photo_path"
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    className="mt-4 bg-background"
                                    onChange={(event) => {
                                        const photo =
                                            event.target.files?.[0] ?? null;

                                        setData('photo_path', photo);
                                        setSelectedPhotoPreview(
                                            photo
                                                ? URL.createObjectURL(photo)
                                                : null,
                                        );
                                    }}
                                />
                                <p className="mt-2 text-xs text-muted-foreground">
                                    JPG or PNG, up to 2 MB. Leave this unchanged
                                    to keep the current photo.
                                </p>
                                {data.photo_path && (
                                    <p className="mt-2 truncate text-xs font-medium">
                                        Selected: {data.photo_path.name}
                                    </p>
                                )}
                                {errors.photo_path && (
                                    <p className="mt-2 text-sm text-destructive">
                                        {errors.photo_path}
                                    </p>
                                )}
                            </div>
                        </aside>

                        <div className="min-w-0">
                            <div className="space-y-6 p-5 sm:p-6">
                                <div>
                                    <h2 className="font-semibold">
                                        Barber information
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Keep the barber&apos;s personal details
                                        up to date.
                                    </p>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">
                                            First name
                                        </Label>
                                        <Input
                                            id="first_name"
                                            name="first_name"
                                            placeholder="John"
                                            value={data.first_name}
                                            aria-invalid={Boolean(
                                                errors.first_name,
                                            )}
                                            onChange={(event) =>
                                                setData(
                                                    'first_name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        {errors.first_name && (
                                            <p className="text-sm text-destructive">
                                                {errors.first_name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">
                                            Last name
                                        </Label>
                                        <Input
                                            id="last_name"
                                            name="last_name"
                                            placeholder="Doe"
                                            value={data.last_name}
                                            aria-invalid={Boolean(
                                                errors.last_name,
                                            )}
                                            onChange={(event) =>
                                                setData(
                                                    'last_name',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        {errors.last_name && (
                                            <p className="text-sm text-destructive">
                                                {errors.last_name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="birthdate">
                                            Birthdate
                                        </Label>
                                        <Input
                                            id="birthdate"
                                            name="birthdate"
                                            type="date"
                                            value={data.birthdate}
                                            aria-invalid={Boolean(
                                                errors.birthdate,
                                            )}
                                            onChange={(event) =>
                                                setData(
                                                    'birthdate',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        {errors.birthdate && (
                                            <p className="text-sm text-destructive">
                                                {errors.birthdate}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="age">Age</Label>
                                        <Input
                                            id="age"
                                            name="age"
                                            value={age}
                                            readOnly
                                            className="bg-muted/40"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Calculated automatically from the
                                            birthdate.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-md border p-4">
                                    <div className="flex sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <Label htmlFor="is_active">
                                                Status
                                            </Label>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {data.is_active
                                                    ? 'This barber is visible to customers and can receive reservations.'
                                                    : 'This barber is hidden from customers and cannot receive new reservations.'}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-3">
                                            <Switch
                                                id="is_active"
                                                checked={data.is_active}
                                                onCheckedChange={(checked) =>
                                                    setData(
                                                        'is_active',
                                                        checked,
                                                    )
                                                }
                                            />
                                            <Label htmlFor="is_active">
                                                {data.is_active
                                                    ? 'Active'
                                                    : 'Inactive'}
                                            </Label>
                                        </div>
                                    </div>
                                    {errors.is_active && (
                                        <p className="mt-2 text-sm text-destructive">
                                            {errors.is_active}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <footer className="flex gap-3 border-t bg-muted/10 p-5 sm:flex-row sm:justify-end sm:p-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={processing}
                                    asChild
                                >
                                    <Link href="/admin/barbers">Cancel</Link>
                                </Button>
                                <Button
                                    type="submit"
                                    className="cursor-pointer"
                                    disabled={processing}
                                >
                                    {processing
                                        ? 'Updating...'
                                        : 'Update Barber'}
                                </Button>
                            </footer>
                        </div>
                    </div>
                </form>
            </section>
        </>
    );
};

Edit.layout = ({ barber }: Props) => ({
    breadcrumbs: [
        {
            title: 'Barbers',
            href: '/admin/barbers',
        },
        {
            title: `Edit ${barber.first_name} ${barber.last_name}`,
            href: `/admin/barbers/${barber.id}/edit`,
        },
    ],
});

export default Edit;
