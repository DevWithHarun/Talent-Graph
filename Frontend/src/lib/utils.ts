import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInCalendarDays, startOfYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : Math.round(val);
  if (typeof val === 'object') {
    const resolved = val.compositeScoutingIndex ?? val.compositeScore ?? val.talentGraphScore ?? val.score ?? val.performanceIndex ?? fallback;
    return typeof resolved === 'number' && !isNaN(resolved) ? Math.round(resolved) : fallback;
  }
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : Math.round(parsed);
}

export function extractCSI(val: any): number {
  return extractNumber(val, 0);
}

export function safeRenderNumber(val: any, fallback = '--'): string | number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') {
    const resolved = val.compositeScore ?? val.compositeScoutingIndex ?? val.talentGraphScore ?? val.score ?? val.performanceIndex;
    if (typeof resolved === 'number' && !isNaN(resolved)) return Math.round(resolved);
    return fallback;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : Math.round(val);
  }
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : Math.round(parsed);
}

export function safeRenderTier(val: any, fallback = 'Developing'): string {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') {
    return val.readinessTier || fallback;
  }
  return String(val);
}


export function calculateLoginStreak(loginHistory: string[]): number {
  if (!loginHistory || loginHistory.length === 0) {
    return 0;
  }

  const sortedDates = loginHistory
    .map(ts => new Date(ts))
    .sort((a, b) => b.getTime() - a.getTime());
  
  const uniqueDays = [...new Set(sortedDates.map(d => d.toISOString().split('T')[0]))];

  let streak = 0;
  let today = new Date();
  
  // Check if latest login is today or yesterday
  const lastLogin = new Date(uniqueDays[0]);
  if (differenceInCalendarDays(today, lastLogin) <= 1) {
    streak = 1;
    let currentDay = lastLogin;

    for (let i = 1; i < uniqueDays.length; i++) {
      const previousDay = new Date(uniqueDays[i]);
      if (differenceInCalendarDays(currentDay, previousDay) === 1) {
        streak++;
        currentDay = previousDay;
      } else {
        break; // Streak is broken
      }
    }
  }
  
  return streak;
}
