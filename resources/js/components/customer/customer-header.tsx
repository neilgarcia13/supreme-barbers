import AppLogo from '@/components/app-logo';
import { UserMenuContent } from '@/components/user-menu-content';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link, usePage } from '@inertiajs/react';
import { CalendarPlus, UserRound } from 'lucide-react';


const CustomerHeader = () => {
  const { auth } = usePage().props;

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/reserve" className="flex items-center">
          <AppLogo />
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/reserve">
              <CalendarPlus />
              <span className="hidden sm:inline">Reserve</span>
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
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
      </div>
    </header>
  )
}

export default CustomerHeader;