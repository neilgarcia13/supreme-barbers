import { Head, Link, router } from '@inertiajs/react';
import {
  LoaderCircle,
  SquarePen,
  Plus,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Barber = {
  id: number;
  first_name: string;
  last_name: string;
  birthdate: string;
  photo_path: string | null;
  is_active: boolean;
};

type Props = {
  barbers: Barber[];
};

type StatusFilter = 'all' | 'active' | 'inactive';
type SortOption =
  'first_name' | 'last_name' | 'age_ascending' | 'age_descending';

const birthdateFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

const shopDateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  timeZone: 'Asia/Manila',
});

const formatBirthdate = (birthdate: string) =>
  birthdateFormatter.format(new Date(`${birthdate}T00:00:00Z`));

const calculateAge = (birthdate: string) => {
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

  return age;
};

const Index = ({ barbers }: Props) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('first_name');
  const [barberToDelete, setBarberToDelete] = useState<Barber | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const visibleBarbers = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return barbers
      .filter((barber) => {
        const fullName =
          `${barber.first_name} ${barber.last_name}`.toLocaleLowerCase();
        const matchesSearch = fullName.includes(normalizedSearch);
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'active' && barber.is_active) ||
          (statusFilter === 'inactive' && !barber.is_active);

        return matchesSearch && matchesStatus;
      })
      .sort((first, second) => {
        if (sortOption === 'first_name') {
          return first.first_name.localeCompare(second.first_name);
        }

        if (sortOption === 'last_name') {
          return first.last_name.localeCompare(second.last_name);
        }

        const ageDifference =
          calculateAge(first.birthdate) -
          calculateAge(second.birthdate);

        return sortOption === 'age_ascending'
          ? ageDifference
          : -ageDifference;
      });
  }, [barbers, search, sortOption, statusFilter]);

  const hasFilters = search.trim() !== '' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
  };

  const handleDelete = () => {
    if (!barberToDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);

    router.delete(`/admin/barbers/${barberToDelete.id}`, {
      preserveScroll: true,
      onSuccess: () => setBarberToDelete(null),
      onFinish: () => setIsDeleting(false),
    });
  };

  return (
    <>
      <Head title="Barbers" />

      <section className="space-y-6 p-4">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Barbers</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage barber profiles and availability.
            </p>
          </div>

          <Button asChild>
            <Link href="/admin/barbers/create">
              <Plus />
              Add barber
            </Link>
          </Button>
        </header>

        {barbers.length > 0 && (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1 lg:max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search barbers"
                aria-label="Search barbers"
                className="pl-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <Select
                value={statusFilter}
                onValueChange={(value: StatusFilter) =>
                  setStatusFilter(value)
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="all">
                    All statuses
                  </SelectItem>
                  <SelectItem value="active">
                    Active
                  </SelectItem>
                  <SelectItem value="inactive">
                    Inactive
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortOption}
                onValueChange={(value: SortOption) =>
                  setSortOption(value)
                }
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="first_name">
                    First name: A-Z
                  </SelectItem>
                  <SelectItem value="last_name">
                    Last name: A-Z
                  </SelectItem>
                  <SelectItem value="age_ascending">
                    Age: youngest first
                  </SelectItem>
                  <SelectItem value="age_descending">
                    Age: oldest first
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm whitespace-nowrap text-muted-foreground lg:ml-auto">
              {visibleBarbers.length} of {barbers.length}{' '}
              {barbers.length === 1 ? 'barber' : 'barbers'}
            </p>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <TooltipProvider>
              <Table>
                <TableCaption className="sr-only">
                  A list of all existing barbers.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barber</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Age
                    </TableHead>
                    <TableHead className="hidden lg:table-cell text-center">
                      Birthdate
                    </TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleBarbers.map((barber) => {
                    const fullName = `${barber.first_name} ${barber.last_name}`;

                    return (
                      <TableRow key={barber.id}>
                        <TableCell>
                          <div className="flex min-w-24 items-center gap-3">
                            <Avatar className="size-10 rounded-md">
                              {barber.photo_path && (
                                <AvatarImage
                                  src={`/storage/${barber.photo_path}`}
                                  alt={
                                    fullName
                                  }
                                  className="object-cover"
                                />
                              )}
                              <AvatarFallback className="rounded-md">
                                <UserRound className="size-5 text-muted-foreground" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {fullName}
                              </p>
                              <p className="text-xs text-muted-foreground sm:hidden">
                                {calculateAge(
                                  barber.birthdate,
                                )}{' '}
                                years old
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {calculateAge(
                            barber.birthdate,
                          )}
                        </TableCell>
                        <TableCell className="hidden text-center lg:table-cell">
                          {formatBirthdate(
                            barber.birthdate,
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {barber.is_active ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                            >
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="ghost"
                              title='Edit barber'
                              size="icon"
                              asChild
                            >
                              <Link
                                href={`/admin/barbers/${barber.id}/edit`}
                                aria-label={`Edit ${fullName}`}
                              >
                                <SquarePen />
                              </Link>
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                title='Delete barber'
                                size="icon"
                                className="text-destructive cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                                aria-label={`Delete ${fullName}`}
                                onClick={() =>
                                setBarberToDelete(
                                    barber,
                                )
                                }
                            >
                                <Trash2 />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {visibleBarbers.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-56 text-center"
                      >
                        <div className="flex flex-col items-center">
                          <p className="mt-3 font-medium">
                            {hasFilters
                              ? 'No matching barbers'
                              : 'No barbers yet'}
                          </p>
                          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            {hasFilters
                              ? 'Try adjusting your search or status filter.'
                              : 'Add your first barber to begin managing reservations.'}
                          </p>
                          {hasFilters && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-4"
                              onClick={
                                clearFilters
                              }
                            >
                              Clear filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        </div>
      </section>

      <AlertDialog
        open={barberToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setBarberToDelete(null);
          }
        }}
      >
        {barberToDelete && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete this barber?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {barberToDelete.first_name}{' '}
                {barberToDelete.last_name} and their profile
                photo will be permanently removed. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isDeleting}
                onClick={(event) => {
                  event.preventDefault();
                  handleDelete();
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Barber'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </>
  );
};

Index.layout = {
  breadcrumbs: [
    {
      title: 'Barbers',
      href: '/admin/barbers',
    },
  ],
};

export default Index;
