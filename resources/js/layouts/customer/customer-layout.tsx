import { Breadcrumbs } from '@/components/breadcrumbs';
import CustomerHeader from '@/components/customer/customer-header';
import type { AppLayoutProps } from '@/types';


const CustomerLayout = ({ children, breadcrumbs = [], }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <CustomerHeader />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {breadcrumbs.length > 0 && (
          <div className="mb-6">
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        )}

        {children}
      </main>
    </div>
  );
}

export default CustomerLayout;