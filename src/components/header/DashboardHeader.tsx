import { Calendar } from '@/components/ui/calendar';

interface DashboardHeaderProps {
  date: Date;
  onDateSelect: (date: Date | undefined) => void;
  availableDates: Date[];
  currentUTCDate: Date;
}

export function DashboardHeader({ 
  date, 
  onDateSelect, 
  availableDates, 
  currentUTCDate 
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Lilypad</h1>
        <h1 className="text-4xl font-bold tracking-tight">
          RP Node Checker
        </h1>
      </div>
      <Calendar
        mode="single"
        selected={date}
        onSelect={onDateSelect}
        disabled={(date) => {
          const utcDate = new Date(
            Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
          );
          return (
            utcDate > currentUTCDate ||
            (!availableDates.some(
              (d) => d.getTime() === utcDate.getTime()
            ) &&
            utcDate.getTime() !== currentUTCDate.getTime())
          );
        }}
        className="rounded-md border"
      />
    </div>
  );
}