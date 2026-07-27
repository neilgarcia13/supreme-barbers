import { UserRoundPen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import { Link, useForm } from "@inertiajs/react";
import { SubmitEvent } from "react";

type Barber = {
  id: number;
  first_name: string;
  last_name: string;
  birthdate: string;
  photo_path: string | null;
  is_active: boolean;
};

type EditProps = {
  barber: Barber;
};


const Edit = ({ barber }: EditProps) => {
  const { data, setData, post, processing, errors } = useForm({
    _method: 'put',
    first_name: barber.first_name,
    last_name: barber.last_name,
    birthdate: barber.birthdate.slice(0, 10),
    photo_path: null as File | null,
    is_active: barber.is_active,
  });

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    post(`/admin/barbers/${barber.id}`, {
      forceFormData: true,
    });
  }

  const calculateAge = (birthdate: string) => {
    if (!birthdate) {
      return '';
    }

    const today = new Date();
    const birthDate = new Date(birthdate);

    let age = today.getFullYear() - birthDate.getFullYear();

    const hasBirthdayPassedThisYear =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());

    if (!hasBirthdayPassedThisYear) {
      age--;
    }

    return age.toString();
  }

  const age = calculateAge(data.birthdate);

  return (
    <div>
      <div className='flex gap-2 items-center px-8 py-4 text-xl font-semibold'>
        <UserRoundPen className='h-5 w-5' />
        Edit Barber
      </div>
      <div className="px-8 py-4 w-10/12">
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              placeholder="John"
              value={data.first_name}
              onChange={(e) => setData('first_name', e.target.value)}
            />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              placeholder="Doe"
              value={data.last_name}
              onChange={(e) => setData('last_name', e.target.value)}
            />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="birthdate">Birthdate</Label>
            <Input
              id="birthdate"
              name="birthdate"
              type="date"
              value={data.birthdate}
              onChange={(e) => setData('birthdate', e.target.value)}
            />
            {errors.birthdate && (
              <p className="text-sm text-destructive">{errors.birthdate}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="age">Age</Label>
            <Input id="age" name="age" value={age} readOnly />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="photo_path">Profile Photo</Label>
            <Input
              id="photo_path"
              name="photo_path"
              type="file"
              onChange={(e) => setData('photo_path', e.target.files?.[0] ?? null)}
            />

            {barber.photo_path && (
              <img
                src={`/storage/${barber.photo_path}`}
                alt={`${barber.first_name} ${barber.last_name}`}
                className="h-24 w-24 rounded object-cover"
              />
            )}

            {errors.photo_path && (
              <p className="text-sm text-destructive">{errors.photo_path}</p>
            )}
          </div>

          <div className="flex flex-col justify-around gap-2">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={data.is_active}
                onCheckedChange={(checked) => setData('is_active', checked)}
              />
              <Label htmlFor="is_active">{data.is_active ? 'Active' : 'Inactive'}</Label>
            </div>
            {errors.is_active && (
              <p className="text-sm text-destructive">{errors.is_active}</p>
            )}
          </div>

          <div className="flex gap-4 mt-2">
            <Button className="cursor-pointer" disabled={processing}>Update</Button>
            <Link href='/admin/barbers'>
              <Button variant='ghost' type="button" className="cursor-pointer">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Edit;