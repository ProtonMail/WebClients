import { addDays, isFriday, isMonday, isSameDay, isSaturday, isTuesday, isWeekend, set } from 'date-fns';

import type { UserSettings } from '@proton/shared/lib/interfaces';
import { SETTINGS_WEEK_START } from '@proton/shared/lib/interfaces';

import type { BookingRange } from '../../bookingsProvider/interface';
import {
    createBookingRangeNextAvailableTime,
    generateDefaultBookingRange,
    getIsBookingsIntersection,
    getIsRecurringBookingsIntersection,
    normalizeBookingRangeToTimeOfWeek,
} from './rangeHelpers';

describe('Booking range helpers', () => {
    describe('generateDefaultBookingRange', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            // This is a Thursday
            jest.setSystemTime(new Date('2026-01-15T10:30:00Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        const checks = (res: BookingRange[]) => {
            // Five elements each representing a day of the work week
            expect(res.length).toBe(5);

            // First element should be a Monday
            expect(res[0].start.getDay()).toEqual(new Date('2026-01-12T08:00:00Z').getDay());
            expect(res[0].end.getDay()).toEqual(new Date('2026-01-12T16:00:00Z').getDay());
            expect(isMonday(res[0].start)).toBe(true);

            // Last element should be a Friday
            expect(res[4].start.getDay()).toEqual(new Date('2026-01-16T08:00:00Z').getDay());
            expect(res[4].end.getDay()).toEqual(new Date('2026-01-16T16:00:00Z').getDay());
            expect(isFriday(res[4].start)).toBe(true);

            // No weekend elements
            expect(res.every((b) => !isWeekend(b.start))).toBe(true);
        };

        it('should return the correct range when week starts on Monday', () => {
            const userSettings = { WeekStart: SETTINGS_WEEK_START.MONDAY } as UserSettings;
            const res = generateDefaultBookingRange(userSettings, new Date(), 'Europe/Zurich', true);
            checks(res);
        });

        it('should return the correct range when week starts on Saturday', () => {
            const userSettings = { WeekStart: SETTINGS_WEEK_START.SATURDAY } as UserSettings;
            const res = generateDefaultBookingRange(userSettings, new Date(), 'Europe/Zurich', true);
            checks(res);
        });

        it('should return the correct range when week starts on Sunday', () => {
            const userSettings = { WeekStart: SETTINGS_WEEK_START.SUNDAY } as UserSettings;
            const res = generateDefaultBookingRange(userSettings, new Date(), 'Europe/Zurich', true);
            checks(res);
        });
    });

    describe('generateDefaultBookingRange', () => {
        const today = new Date('2026-01-15T10:30:00Z');
        beforeEach(() => {
            jest.useFakeTimers();
            // This is a Thursday
            jest.setSystemTime(today);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        const tomorrow = addDays(today, 1);
        const tomorrowStart = set(tomorrow, { hours: 9 });

        const futureMonday = set(today, { month: 1, date: 9 });

        it('should create a range for tomorrow if no start date given', () => {
            const userSettings = { WeekStart: SETTINGS_WEEK_START.MONDAY } as UserSettings;
            const res = createBookingRangeNextAvailableTime({
                userSettings,
                bookingRanges: [],
                timezone: 'Europe/Zurich',
                startDate: undefined,
            });

            expect(isFriday(res.start)).toBe(true);
            expect(isSameDay(res.start, tomorrowStart)).toBe(true);
        });

        it('should skip one day if tomorrow is already booked', () => {
            const userSettings = { WeekStart: SETTINGS_WEEK_START.MONDAY } as UserSettings;
            const res = createBookingRangeNextAvailableTime({
                userSettings,
                bookingRanges: [{ start: tomorrowStart } as BookingRange],
                timezone: 'Europe/Zurich',
                startDate: undefined,
            });

            expect(isSaturday(res.start)).toBe(true);
            expect(isSameDay(res.start, addDays(tomorrow, 1))).toBe(true);
        });

        it('should create range on start date if same as week start', () => {
            const userSettings = { WeekStart: SETTINGS_WEEK_START.MONDAY } as UserSettings;
            const res = createBookingRangeNextAvailableTime({
                userSettings,
                bookingRanges: [],
                timezone: 'Europe/Zurich',
                startDate: futureMonday,
            });

            expect(isMonday(res.start)).toBe(true);
            expect(isSameDay(res.start, futureMonday)).toBe(true);
        });

        it('should create range on week start if start date is after week start', () => {
            const userSettings = { WeekStart: SETTINGS_WEEK_START.MONDAY } as UserSettings;
            const res = createBookingRangeNextAvailableTime({
                userSettings,
                bookingRanges: [],
                timezone: 'Europe/Zurich',
                startDate: addDays(futureMonday, 2),
            });

            expect(isMonday(res.start)).toBe(true);
            expect(isSameDay(res.start, futureMonday)).toBe(true);
        });

        it('should create range first available day if week start is not availalbe', () => {
            const userSettings = { WeekStart: SETTINGS_WEEK_START.MONDAY } as UserSettings;
            const res = createBookingRangeNextAvailableTime({
                userSettings,
                bookingRanges: [{ start: futureMonday } as BookingRange],
                timezone: 'Europe/Zurich',
                startDate: futureMonday,
            });

            expect(isTuesday(res.start)).toBe(true);
        });
    });

    describe('normalizeBookingRangeToTimeOfWeek', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            // Set to Wednesday, Nov 27, 2025, 10:00 AM
            jest.setSystemTime(new Date(2025, 10, 27, 10, 0, 0));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should normalize a future date to current week with same day and time', () => {
            // Monday, Dec 1, 2025, 2:00 PM (next week)
            const futureMonday = new Date(2025, 11, 1, 14, 0, 0);
            const normalized = normalizeBookingRangeToTimeOfWeek(futureMonday);

            // Should be Monday of current week at 2:00 PM
            expect(normalized.getDay()).toBe(1); // Monday
            expect(normalized.getHours()).toBe(14);
            expect(normalized.getMinutes()).toBe(0);
            // The date should be in the current week (Nov 23-29)
            expect(normalized.getDate()).toBeGreaterThanOrEqual(23);
            expect(normalized.getDate()).toBeLessThanOrEqual(29);
        });

        it('should normalize a past date to current week with same day and time', () => {
            // Tuesday, Nov 18, 2025, 9:30 AM (last week)
            const pastTuesday = new Date(2025, 10, 18, 9, 30, 0);
            const normalized = normalizeBookingRangeToTimeOfWeek(pastTuesday);

            // Should be Tuesday of current week at 9:30 AM
            expect(normalized.getDay()).toBe(2); // Tuesday
            expect(normalized.getHours()).toBe(9);
            expect(normalized.getMinutes()).toBe(30);
            // The date should be in the current week (Nov 23-29)
            expect(normalized.getDate()).toBeGreaterThanOrEqual(23);
            expect(normalized.getDate()).toBeLessThanOrEqual(29);
        });

        it('should preserve time when normalizing across weeks', () => {
            const inputDate = new Date(2025, 11, 5, 14, 30, 45, 123);
            const normalized = normalizeBookingRangeToTimeOfWeek(inputDate);

            // Same weekday
            expect(normalized.getDay()).toBe(inputDate.getDay());
            // Same time
            expect(normalized.getHours()).toBe(inputDate.getHours());
            expect(normalized.getMinutes()).toBe(inputDate.getMinutes());
            // Seconds and milliseconds reset
            expect(normalized.getSeconds()).toBe(0);
            expect(normalized.getMilliseconds()).toBe(0);
        });

        it('should handle same week dates correctly', () => {
            // Friday, Nov 28, 2025, 4:15 PM (this week)
            const thisFriday = new Date(2025, 10, 28, 16, 15, 0);
            const normalized = normalizeBookingRangeToTimeOfWeek(thisFriday);

            // Should remain Friday at 4:15 PM
            expect(normalized.getDay()).toBe(5);
            expect(normalized.getHours()).toBe(16);
            expect(normalized.getMinutes()).toBe(15);
            expect(isSameDay(normalized, thisFriday)).toBe(true);
        });
    });

    describe('getIsBookingsIntersection', () => {
        it('should return null when no intersection exists', () => {
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-25T09:00:00Z'),
                    end: new Date('2025-11-25T10:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            const result = getIsBookingsIntersection({
                start: new Date('2025-11-25T11:00:00Z'),
                end: new Date('2025-11-25T12:00:00Z'),
                bookingRanges,
            });

            expect(result).toBeNull();
        });

        it('should return intersection when ranges overlap', () => {
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-25T09:00:00Z'),
                    end: new Date('2025-11-25T10:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            const result = getIsBookingsIntersection({
                start: new Date('2025-11-25T09:30:00Z'),
                end: new Date('2025-11-25T11:00:00Z'),
                bookingRanges,
            });

            expect(result).not.toBeNull();
        });

        it('should adjust intersection at the end of existing range', () => {
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-25T09:00:00Z'),
                    end: new Date('2025-11-25T10:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            const result = getIsBookingsIntersection({
                start: new Date('2025-11-25T09:30:00Z'), // Starts within existing range
                end: new Date('2025-11-25T11:00:00Z'),
                bookingRanges,
            });

            expect(result).not.toBeNull();
            expect(result?.start).toEqual(new Date('2025-11-25T10:00:00Z'));
            expect(result?.end).toEqual(new Date('2025-11-25T11:00:00Z'));
        });

        it('should adjust intersection at the start of existing range', () => {
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-25T10:00:00Z'),
                    end: new Date('2025-11-25T11:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            const result = getIsBookingsIntersection({
                start: new Date('2025-11-25T09:00:00Z'),
                end: new Date('2025-11-25T10:30:00Z'), // Ends within existing range
                bookingRanges,
            });

            expect(result).not.toBeNull();
            expect(result?.start).toEqual(new Date('2025-11-25T09:00:00Z'));
            expect(result?.end).toEqual(new Date('2025-11-25T10:00:00Z'));
        });

        it('should return null when new range completely engulfs existing range', () => {
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-25T10:00:00Z'),
                    end: new Date('2025-11-25T11:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            const result = getIsBookingsIntersection({
                start: new Date('2025-11-25T09:00:00Z'),
                end: new Date('2025-11-25T12:00:00Z'), // Completely contains existing range
                bookingRanges,
            });

            expect(result).toBeNull();
        });
    });

    describe('getIsRecurringBookingsIntersection', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            // Set to Wednesday, Nov 27, 2025, 10:00 AM
            jest.setSystemTime(new Date('2025-11-27T10:00:00Z'));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should return null when no intersection on the same weekday', () => {
            // Existing range: Monday this week, 9-10 AM
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-24T09:00:00Z'),
                    end: new Date('2025-11-24T10:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            // User tries to add: Tuesday next week, 11-12 AM (different day)
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-02T11:00:00Z'),
                end: new Date('2025-12-02T12:00:00Z'),
                bookingRanges,
            });

            expect(result).toBeNull();
        });

        it('should return null when adding range on future weekday with no overlap', () => {
            // Existing range: Monday this week, 9-10 AM
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-24T09:00:00Z'),
                    end: new Date('2025-11-24T10:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            // User tries to add: Monday next week, 11-12 AM (same day, no time overlap)
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-01T11:00:00Z'),
                end: new Date('2025-12-01T12:00:00Z'),
                bookingRanges,
            });

            expect(result).toBeNull();
        });

        it('should detect intersection across different weeks with same weekday and overlapping times', () => {
            // Existing range: Monday this week, 9-10 AM
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-24T09:00:00Z'),
                    end: new Date('2025-11-24T10:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            // User tries to add: Monday next week, 9:30-11 AM
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-01T09:30:00Z'),
                end: new Date('2025-12-01T11:00:00Z'),
                bookingRanges,
            });

            expect(result).not.toBeNull();
        });

        it('should adjust intersection at the end of existing range, preserving original week', () => {
            // Existing range: Monday this week, 9-10 AM
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-24T09:00:00Z'),
                    end: new Date('2025-11-24T10:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            // User tries to add: Monday next week, 9:30-11 AM
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-01T09:30:00Z'),
                end: new Date('2025-12-01T11:00:00Z'),
                bookingRanges,
            });

            // Should suggest: Monday Dec 1, 10:00-11:00 AM (same week as user's selection)
            expect(result).not.toBeNull();
            expect(result?.start.getTime()).toBe(new Date('2025-12-01T10:00:00Z').getTime());
            expect(result?.end.getTime()).toBe(new Date('2025-12-01T11:00:00Z').getTime());
        });

        it('should adjust intersection at the start of existing range, preserving original week', () => {
            // Existing range: Monday this week, 10-11 AM
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-24T10:00:00Z'),
                    end: new Date('2025-11-24T11:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            // User tries to add: Monday next week, 9-10:30 AM
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-01T09:00:00Z'),
                end: new Date('2025-12-01T10:30:00Z'),
                bookingRanges,
            });

            // Should suggest: Monday Dec 1, 9:00-10:00 AM (same week as user's selection)
            expect(result).not.toBeNull();
            expect(result?.start.getTime()).toBe(new Date('2025-12-01T09:00:00Z').getTime());
            expect(result?.end.getTime()).toBe(new Date('2025-12-01T10:00:00Z').getTime());
        });

        it('should handle ranges from past weeks correctly', () => {
            // Existing range: Monday this week, 9-10 AM
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-24T09:00:00Z'),
                    end: new Date('2025-11-24T10:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            // User tries to add: Monday last week, 9:30-11 AM
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-11-17T09:30:00Z'),
                end: new Date('2025-11-17T11:00:00Z'),
                bookingRanges,
            });

            // Should suggest: Monday Nov 17, 10:00-11:00 AM (preserves user's selected week)
            expect(result).not.toBeNull();
            expect(result?.start.getTime()).toBe(new Date('2025-11-17T10:00:00Z').getTime());
            expect(result?.end.getTime()).toBe(new Date('2025-11-17T11:00:00Z').getTime());
        });

        it('should return null when new range completely engulfs existing range', () => {
            // Existing range: Monday this week, 10-11 AM
            const bookingRanges: BookingRange[] = [
                {
                    id: '1',
                    start: new Date('2025-11-24T10:00:00Z'),
                    end: new Date('2025-11-24T11:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
            ];

            // User tries to add: Monday next week, 9-12 PM (completely contains existing range)
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-01T09:00:00Z'),
                end: new Date('2025-12-01T12:00:00Z'),
                bookingRanges,
            });

            expect(result).toBeNull();
        });
    });
});
