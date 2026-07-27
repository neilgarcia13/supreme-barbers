import { Head, Link, router } from '@inertiajs/react';
import { Plus, PenBox, Trash2 } from 'lucide-react';

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

type Barber = {
  id: number;
  first_name: string;
  last_name: string;
  birthdate: string;
  photo_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

type Props = {
  barbers: Barber[];
}

const Index = ({ barbers }: Props) => {
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
            <TableCaption>A list of all existing barbers.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Barber ID</TableHead>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Birthdate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-center'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barbers.map((barber) => (
                <TableRow>
                  <TableCell className="font-medium">{barber.id}</TableCell>
                  <TableCell>{barber.first_name}</TableCell>
                  <TableCell>{barber.last_name}</TableCell>
                  <TableCell>{barber.birthdate}</TableCell>
                  <TableCell>{barber.is_active ? 'Active' : 'Inactive'}</TableCell>
                  <TableCell>
                    <div className='flex gap-2 justify-center'>
                      <Link href={`/admin/barbers/${barber.id}/edit`}>
                        <Button size='sm' variant='outline'>
                          <PenBox />
                          Edit
                        </Button>
                      </Link>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this barber?')) {
                            router.delete(`/admin/barbers/${barber.id}`);
                          }
                        }}>
                        <Trash2 />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}

Index.layout = {
  breadcrumbs: [
    {
      title: 'Barbers',
      href: '/admin/barbers',
    },
  ],
};

export default Index;