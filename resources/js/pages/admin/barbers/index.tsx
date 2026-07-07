import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button';

const index = () => {
  return (
    <>
      <Head title="Barbers" />
      <div className="p-4 space-y-4">
        <div className='flex justify-end-safe'>
          <Link href="/admin/barbers/create">
            <Button size='sm' className='cursor-pointer'>
              <Plus className='w-4 h-4' />
              Create Barber
            </Button>
          </Link>
        </div>
        <div>
          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-25">Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">INV001</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Credit Card</TableCell>
                <TableCell className="text-right">$250.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

index.layout = {
  breadcrumbs: [
    {
      title: 'Barbers',
      href: '/admin/barbers',
    },
  ],
};

export default index;