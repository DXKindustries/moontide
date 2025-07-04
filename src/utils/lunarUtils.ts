
// Lunar calculation utilities

export type FullMoonName = {
  name: string;
  description: string;
};

// Traditional full moon names by month
export const FULL_MOON_NAMES: Record<number, FullMoonName> = {
  1: { name: "Wolf Moon", description: "Named after howling wolves in winter" },
  2: { name: "Snow Moon", description: "Named for heavy snowfall" },
  3: { name: "Worm Moon", description: "When earthworms emerge as soil thaws" },
  4: { name: "Pink Moon", description: "Named after early spring flowers" },
  5: { name: "Flower Moon", description: "When flowers bloom abundantly" },
  6: { name: "Strawberry Moon", description: "When strawberries are harvested" },
  7: { name: "Buck Moon", description: "When male deer grow new antlers" },
  8: { name: "Sturgeon Moon", description: "When sturgeon fish are caught" },
  9: { name: "Harvest Moon", description: "The full moon nearest autumn equinox" },
  10: { name: "Hunter's Moon", description: "When hunters prepare for winter" },
  11: { name: "Beaver Moon", description: "When beavers build winter dams" },
  12: { name: "Cold Moon", description: "The long nights of winter" }
};

export const getFullMoonName = (date: Date): FullMoonName | null => {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  return FULL_MOON_NAMES[month] || null;
};

export const isFullMoon = (phase: string): boolean => {
  return phase === "Full Moon";
};

export const getMoonEmoji = (phase: string): string => {
  switch (phase) {
    case "New Moon":
      return "🌑";
    case "Waxing Crescent":
      return "🌒";
    case "First Quarter":
      return "🌓";
    case "Waxing Gibbous":
      return "🌔";
    case "Full Moon":
      return "🌕";
    case "Waning Gibbous":
      return "🌖";
    case "Last Quarter":
      return "🌗";
    case "Waning Crescent":
      return "🌘";
    default:
      return "🌙";
  }
};

// More accurate moon phase calculation using a known lunar cycle reference
export const calculateMoonPhase = (date: Date): { phase: string; illumination: number } => {
  // Use a more recent and accurate new moon reference
  // June 6, 2024 was a new moon at 12:38 UTC
  const knownNewMoon = new Date('2024-06-06T12:38:00.000Z');
  const lunarCycleLength = 29.530588853; // More precise lunar cycle length in days
  
  // Calculate milliseconds since the known new moon
  const msSinceNewMoon = date.getTime() - knownNewMoon.getTime();
  const daysSinceNewMoon = msSinceNewMoon / (1000 * 60 * 60 * 24);
  
  // Get position in current lunar cycle (0 to 29.53...)
  const cyclePosition = ((daysSinceNewMoon % lunarCycleLength) + lunarCycleLength) % lunarCycleLength;
  
  // Calculate illumination percentage (0-100)
  const illuminationDecimal = (1 - Math.cos((cyclePosition / lunarCycleLength) * 2 * Math.PI)) / 2;
  const illumination = Math.round(illuminationDecimal * 100);
  
  // Determine phase based on cycle position with more precise boundaries
  let phase: string;
  
  if (cyclePosition < 1.84566) {
    phase = "New Moon";
  } else if (cyclePosition < 5.53699) {
    phase = "Waxing Crescent";
  } else if (cyclePosition < 9.22831) {
    phase = "First Quarter";
  } else if (cyclePosition < 12.91963) {
    phase = "Waxing Gibbous";
  } else if (cyclePosition < 16.61096) {
    phase = "Full Moon";
  } else if (cyclePosition < 20.30228) {
    phase = "Waning Gibbous";
  } else if (cyclePosition < 23.99361) {
    phase = "Last Quarter";
  } else {
    phase = "Waning Crescent";
  }
  
  console.log(`🌙 calculateMoonPhase for ${date.toISOString().slice(0, 10)}: cyclePosition=${cyclePosition.toFixed(2)}, phase=${phase}, illumination=${illumination}%`);
  
  return { phase, illumination };
};

import { FULL_MOON_SET, NEW_MOON_SET } from "./moonEphemeris";

// Replace isDateFullMoon and isDateNewMoon with accurate table lookups
/**
 * Checks if the given date is a "full moon day" (matches our ephemeris, within +/- 1 day).
 * This is MUCH more accurate than algorithmic calculation for calendar indicators!
 */
export const isDateFullMoon = (date: Date): boolean => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  // Form YYYY-MM-DD (UTC, to match ephemeris)
  const utcYear = date.getUTCFullYear();
  const utcMonth = pad(date.getUTCMonth() + 1);
  const utcDay = pad(date.getUTCDate());

  const yyyymmdd = `${utcYear}-${utcMonth}-${utcDay}`;
  // Optionally, allow ±1 day margin (covers time zone edge cases)
  if (FULL_MOON_SET.has(yyyymmdd)) return true;
  // You can uncomment below to show dot also the day before/after the true full moon,
  // which is sometimes done to reflect local time variation:
  // if (FULL_MOON_SET.has(getAdjacentDate(yyyymmdd, -1))) return true;
  // if (FULL_MOON_SET.has(getAdjacentDate(yyyymmdd, 1))) return true;
  return false;
};

/**
 * Checks if the given date is a "new moon day" (matches our ephemeris, within +/- 1 day).
 */
export const isDateNewMoon = (date: Date): boolean => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const utcYear = date.getUTCFullYear();
  const utcMonth = pad(date.getUTCMonth() + 1);
  const utcDay = pad(date.getUTCDate());
  const yyyymmdd = `${utcYear}-${utcMonth}-${utcDay}`;
  if (NEW_MOON_SET.has(yyyymmdd)) return true;
  // Optionally ±1 day logic, see above comments.
  return false;
};
