import { endOfWeek, getUnixTime, startOfWeek } from 'date-fns';

import { getWeekStartsOn } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';

export interface WeekRange {
    start: number;
    end: number;
}

/**
 * Converts an array of displayed calendar days into weekly time ranges for API requests.
 * Filters out past days (before current time) and groups consecutive days by calendar week.
 * Each week range starts from 'now' if the week start is in the past, otherwise from the week start.
 *
 * @param days - Array of Date objects representing displayed calendar days
 * @returns Array of week ranges with Unix timestamps (start and end), or empty array if no future days
 *
 * @example
 * const days = [
 *   new Date('2025-10-27'),
 *   new Date('2025-10-28'),
 *   // ... more days
 *   new Date('2025-11-30')
 * ];
 * const ranges = generateWeekRangesFromDays(days);
 * // Returns: [
 * //   { start: 1729900800, end: 1730505599 },
 * //   { start: 1730505600, end: 1731110399 },
 * //   ...
 * // ]
 */
export const generateWeekRangesFromDays = (days: Date[]): WeekRange[] => {
    const now = new Date();
    const weekStartsOn = getWeekStartsOn(dateLocale);
    const futureDays = days.filter((day) => day >= now);

    if (futureDays.length === 0) {
        return [];
    }

    const weekRanges: WeekRange[] = [];
    let currentWeekStart: Date | null = null;

    futureDays.forEach((day, index) => {
        const dayWeekStart = startOfWeek(day, { weekStartsOn });

        if (!currentWeekStart || dayWeekStart.getTime() !== currentWeekStart.getTime()) {
            if (currentWeekStart) {
                const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn });
                weekRanges.push({
                    start: getUnixTime(currentWeekStart),
                    end: getUnixTime(weekEnd),
                });
            }
            currentWeekStart = dayWeekStart < now ? now : dayWeekStart;
        }

        if (index === futureDays.length - 1 && currentWeekStart) {
            const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn });
            weekRanges.push({
                start: getUnixTime(currentWeekStart),
                end: getUnixTime(weekEnd),
            });
        }
    });

    return weekRanges;
};
