import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

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
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4 wide:space-y-0 wide:flex wide:items-start wide:justify-between">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Lilypad</h1>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          RP Node Checker
        </h1>
      </div>
      
      {/* Mobile Calendar */}
      <div className="wide:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(date, 'PPP')}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[400px]">
            <SheetHeader>
              <SheetTitle>Select Date</SheetTitle>
              <SheetDescription>
                Choose a date to view node activity
              </SheetDescription>
            </SheetHeader>
            <div className="flex justify-center py-4">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => {
                  onDateSelect(newDate);
                  setIsOpen(false);
                }}
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
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Calendar */}
      <div className="hidden wide:block">
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
    </div>
  );
}