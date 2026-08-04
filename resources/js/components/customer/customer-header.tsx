import AppLogo from '@/components/app-logo';
import { UserMenuContent } from '@/components/user-menu-content';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { CalendarDays, CalendarPlus, UserRound } from 'lucide-react';

const customerNavItems = [
  {
    title: 'Reserve',
    href: '/reserve',
    icon: CalendarPlus,
  },
  {
    title: 'My Reservations',
    href: '/my-reservations',
    icon: CalendarDays,
  },
];

const CustomerHeader = () => {
  const page = usePage();
  const { auth } = page.props;
  const currentPath = page.url.split('?')[0];

  const isActive = (href: string) =>
    href === '/reserve'
      ? currentPath === href || currentPath.startsWith('/reserve/')
      : currentPath === href;

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <Link
            href="/reserve"
            className="flex min-w-0 items-center"
            aria-label="Supreme Barbers reservation page"
          >
            <AppLogo />
          </Link>

          <nav
            aria-label="Customer navigation"
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 sm:flex"
          >
            {customerNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Button
                  key={item.href}
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon />
                    {item.title}
                  </Link>
                </Button>
              );
            })}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Open user menu"
              >
                <UserRound />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav
          aria-label="Customer navigation"
          className="grid grid-cols-2 border-t sm:hidden"
        >
          {customerNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center justify-center gap-2 border-b-2 border-transparent text-sm font-medium text-muted-foreground transition-colors',
                  active && 'border-primary text-foreground',
                )}
              >
                <Icon className="size-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default CustomerHeader;
