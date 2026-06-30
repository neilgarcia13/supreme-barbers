import { UsersRound } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const create = () => {
  return (
    <div>
      <div className='flex gap-2 items-center p-4 text-xl font-semibold'>
        <UsersRound className='h-5 w-5' />
        Create Barber
      </div>
      <div className="p-4">
        <form>
          <div className="gap-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" placeholder="John" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" placeholder="Doe" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthdate">Birthdate</Label>
            <Input id="birthdate" type="date" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input id="age" disabled />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile_photo">Profile Photo</Label>
            <Input id="profile_photo" type="file" />
          </div>

          <div>
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <Switch id="active" />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>

          <div className="flex gap-4">
            <Button>Submit</Button>
            <Button variant='ghost'>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default create;