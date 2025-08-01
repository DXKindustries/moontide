
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { addMonths, subMonths, isAfter } from "date-fns";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const touchStartX = React.useRef<number | null>(null);
  const [swipeDirection, setSwipeDirection] = React.useState<"next" | "prev" | null>(null);
  const handleTouchStart = React.useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.changedTouches[0].clientX;
  }, []);

  const handleMonthChange = React.useCallback(
    (date: Date) => {
      const currentMonth = props.month ?? new Date();
      const isNext = isAfter(date, currentMonth);
      setSwipeDirection(isNext ? "next" : "prev");
      props.onMonthChange?.(date);
    },
    [props.onMonthChange, props.month]
  );

  const handleTouchEnd = React.useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartX.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartX.current;
      const threshold = 40;
      if (Math.abs(diff) > threshold) {
        const currentMonth = props.month ?? new Date();
        const newMonth = diff < 0 ? addMonths(currentMonth, 1) : subMonths(currentMonth, 1);
        handleMonthChange(newMonth);
      }
      touchStartX.current = null;
    },
    [props.month, handleMonthChange]
  );

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onAnimationEnd={() => setSwipeDirection(null)}
      className={cn(
        swipeDirection === "next" && "calendar-animate-next",
        swipeDirection === "prev" && "calendar-animate-prev"
      )}
    >
      <style>{`
        @keyframes calendar-slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes calendar-slide-right {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .calendar-animate-next .rdp-months { animation: calendar-slide-left 0.04s ease-in-out; }
        .calendar-animate-prev .rdp-months { animation: calendar-slide-right 0.04s ease-in-out; }
      `}</style>
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3 pointer-events-auto", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
        onMonthChange={handleMonthChange}
        components={{
          IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
