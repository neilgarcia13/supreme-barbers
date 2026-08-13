import type { Ref } from "react";

export type ScheduleBarber = {
  id: number;
  first_name: string;
  last_name: string;
  is_active: boolean;
};

export type ScheduleReservation = {
  id: number;
  starts_at: string;
  ends_at: string;
  notes: string | null;
  status: 'confirmed';
  customer: {
    id: number;
    name: string;
  };
};

export type ScheduleSlot = {
  startsAt: Date;
  endsAt: Date;
  reservation: ScheduleReservation | null;
  isElapsed: boolean;
};

type DailyScheduleExportProps = {
  ref?: Ref<HTMLDivElement>;
  barber: ScheduleBarber | undefined;
  date: Date | null;
  slots: ScheduleSlot[];
  currentTime: number;
};

type SlotStatus =
  | 'Reserved'
  | 'In progress'
  | 'Completed'
  | 'Available'
  | 'No reservation';

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const generatedAtFormatter = new Intl.DateTimeFormat('en-PH', {
  timeZone: 'Asia/Manila',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

const getSlotStatus = (
  slot: ScheduleSlot,
  currentTime: number,
): SlotStatus => {
  if (slot.reservation) {
    if (slot.endsAt.getTime() <= currentTime) {
      return 'Completed';
    }

    if (slot.startsAt.getTime() <= currentTime) {
      return 'In progress';
    }

    return 'Reserved';
  }

  return slot.isElapsed ? 'No reservation' : 'Available';
};

const statusClassNames: Record<SlotStatus, string> = {
  Reserved: 'bg-amber-400 text-neutral-950',
  'In progress': 'bg-amber-100 text-amber-900',
  Completed: 'bg-neutral-200 text-neutral-700',
  Available: 'bg-emerald-100 text-emerald-800',
  'No reservation': 'bg-neutral-100 text-neutral-500',
};

const DailyScheduleExport = ({
  ref,
  barber,
  date,
  slots,
  currentTime,
}: DailyScheduleExportProps) => {
  if (!barber || !date) {
    return null;
  }

  const reservedCount = slots.filter(
    (slot) => slot.reservation !== null,
  ).length;

  return (
    <div ref={ref} className="w-270 overflow-hidden border border-neutral-200 bg-white text-neutral-950">
      <header className="border-b-4 border-amber-400 bg-neutral-950 px-10 py-8 text-white">
        <div className="flex items-center justify-between gap-10">
          <div className="flex items-center gap-5">
            <img
              src="/images/brand/supreme-barbers-logo-dark.png"
              alt="Supreme Barbers"
              className="size-20 shrink-0 object-contain"
            />

            <div>
              <p className="text-sm font-semibold">
                Supreme Barbers
              </p>
              <h2 className="mt-1 text-4xl font-semibold">
                Daily Schedule
              </h2>
            </div>
          </div>

          <div className="text-right">
            <p className="text-lg font-semibold">
              {barber.first_name} {barber.last_name}
            </p>
            <p className="mt-1 text-sm text-neutral-300">
              {dateFormatter.format(date)}
            </p>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-neutral-700 pt-5 text-sm">
          <p>Operating hours: 9:00 AM - 9:00 PM</p>
          <p>
            {reservedCount} of {slots.length} slots reserved
          </p>
        </div>
      </header>

      <main className="px-10 py-6">
        <div className="grid grid-cols-[12rem_minmax(0,1fr)_10rem] gap-5 border-b-2 border-neutral-900 px-4 pb-3 text-xs font-semibold text-neutral-500 uppercase">
          <span>Time</span>
          <span>Customer</span>
          <span className="text-center">Status</span>
        </div>

        {slots.map((slot) => {
          const status = getSlotStatus(slot, currentTime);

          return (
            <div
              key={slot.startsAt.toISOString()}
              className="grid min-h-18 grid-cols-[12rem_minmax(0,1fr)_10rem] items-center gap-5 border-b border-neutral-200 px-4 py-3 last:border-b-0"
            >
              <p className="font-semibold">
                {timeFormatter.format(slot.startsAt)} -{' '}
                {timeFormatter.format(slot.endsAt)}
              </p>

              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {slot.reservation?.customer.name ??
                    'No reservation'}
                </p>

                {slot.reservation?.notes && (
                  <p className="mt-1 truncate text-sm text-neutral-500">
                    Note: {slot.reservation.notes}
                  </p>
                )}
              </div>

              <span
                className={`justify-self-center-safe rounded-full px-3 py-1 text-xs font-semibold ${statusClassNames[status]}`}
              >
                {status}
              </span>
            </div>
          );
        })}
      </main>

      <footer className="bg-amber-400 px-10 py-5 text-xs">
        <p>
          Generated{' '}
          {generatedAtFormatter.format(new Date(currentTime))}
        </p>
      </footer>
    </div>
  );
};

export default DailyScheduleExport;