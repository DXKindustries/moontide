import React from 'react';
import { addMonths, subMonths } from 'date-fns';
// Use lightweight local stubs to avoid bundling the full framer-motion library
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TideForecast } from '@/services/tide/types';
import {
  isDateFullMoon,
  isDateNewMoon,
  getFullMoonName,
} from '@/utils/lunarUtils';
import { getSolarEvents } from '@/utils/solarUtils';
import MoonTideIcon from '@/components/MoonTideIcon';

export type MoonCalendarProps = {
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  weeklyForecast: TideForecast[];
};

const swipeConfidenceThreshold = 50;

const variants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

const MoonCalendar: React.FC<MoonCalendarProps> = ({
  selectedDate,
  onSelectDate,
  weeklyForecast,
}) => {
  const [displayMonth, setDisplayMonth] = React.useState<Date>(
    selectedDate || new Date()
  );
  const [direction, setDirection] = React.useState(0);

  const changeMonth = React.useCallback(
    (newMonth: Date) => {
      setDirection(newMonth > displayMonth ? 1 : -1);
      setDisplayMonth(newMonth);
    },
    [displayMonth]
  );

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    const { x } = info.offset;
    if (x < -swipeConfidenceThreshold) {
      changeMonth(addMonths(displayMonth, 1));
    } else if (x > swipeConfidenceThreshold) {
      changeMonth(subMonths(displayMonth, 1));
    }
  };

  const modifiers = React.useMemo(
    () => ({
      fullMoon: (date: Date) => isDateFullMoon(date),
      newMoon: (date: Date) => isDateNewMoon(date),
      solarEvent: (date: Date) => !!getSolarEvents(date),
    }),
    []
  );

  const modifiersClassNames = {
    fullMoon: 'calendar-full-moon-overlay',
    newMoon: 'calendar-new-moon-overlay',
    solarEvent: 'calendar-solar-event',
  };

  const currentYear = displayMonth.getFullYear();
  const currentMonth = displayMonth.getMonth() + 1;
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const solarEventsInMonth = React.useMemo(() => {
    const events = [] as ReturnType<typeof getSolarEvents>[];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth - 1, day);
      const e = getSolarEvents(d);
      if (e) events.push(e);
    }
    return events;
  }, [displayMonth, daysInMonth]);

  const fullMoonInMonth = React.useMemo(() => {
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonth - 1, day);
      if (isDateFullMoon(d)) return getFullMoonName(d);
    }
    return null;
  }, [displayMonth, daysInMonth]);

  // preload adjacent months data
  React.useEffect(() => {
    addMonths(displayMonth, -1);
    addMonths(displayMonth, 1);
  }, [displayMonth]);

  return (
    <div className="overflow-hidden">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={displayMonth.toISOString()}
          className="touch-pan-y"
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', ease: 'easeInOut', duration: 0.04 }}
          drag="x"
          dragElastic={0.2}
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={handleDragEnd}
        >
          <Card className="bg-card/50 backdrop-blur-md">
            <CardHeader className="flex items-center gap-2">
              <MoonTideIcon width={20} height={20} />
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <style>{`
          .calendar-full-moon-overlay {
            position: relative !important;
            background-color: #facc15 !important;
            border-radius: 50% !important;
            color: #000 !important;
            font-weight: 900 !important;
          }
          .calendar-full-moon-overlay:hover {
            background-color: #eab308 !important;
          }
          .calendar-new-moon-overlay {
            position: relative !important;
            background-color: #a3a3a3 !important;
            border-radius: 50% !important;
            color: #000 !important;
            font-weight: 900 !important;
          }
          .calendar-new-moon-overlay:hover {
            background-color: #737373 !important;
          }
          .calendar-solar-event {
            position: relative;
          }
          .calendar-solar-event::after {
            content: '';
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            bottom: 4px;
            width: 0.5rem;
            height: 0.5rem;
            background-color: #f97316;
            border-radius: 9999px;
            pointer-events: none;
          }
        `}</style>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onSelectDate}
                month={displayMonth}
                onMonthChange={changeMonth}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                footer={
                  <div className="mt-3 pt-3 border-t border-muted">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          Full Moon
                        </span>
                        {fullMoonInMonth && (
                          <span className="text-xs text-yellow-400 font-medium">
                            {fullMoonInMonth.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <span className="text-xs text-muted-foreground">
                        New Moon
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">
                          Solar Event
                        </span>
                        {solarEventsInMonth.map((event, idx) => (
                          <span
                            key={idx}
                            className="text-xs text-orange-400 font-medium"
                          >
                            {event.emoji} {event.name} — {event.description}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MoonCalendar;
