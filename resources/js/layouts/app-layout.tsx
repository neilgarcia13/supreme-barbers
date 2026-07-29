import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import CustomerLayout from './customer/customer-layout';
import type { AppLayoutProps } from '@/types';
import { usePage } from '@inertiajs/react';

export default function AppLayout({
    children,
    breadcrumbs,
}: AppLayoutProps) {
    const { auth } = usePage().props;

    if (auth.user.role === 'customer') {
        return (
            <CustomerLayout breadcrumbs={breadcrumbs}>
                {children}
            </CustomerLayout>
        );
    }

    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs}>
            {children}
        </AppSidebarLayout>
    );
}