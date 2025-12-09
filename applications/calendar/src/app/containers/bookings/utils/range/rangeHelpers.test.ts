import {
    addDays,
    isFriday,
    isMonday,
    isSameDay,
    isSameHour,
    isSameMinute,
    isSaturday,
    isSunday,
    isThursday,
    isTuesday,
    set,
} from 'date-fns';

import type { UserSettings } from '@proton/shared/lib/interfaces';
import { SETTINGS_WEEK_START } from '@proton/shared/lib/interfaces';

import { type BookingRange, BookingRangeError, DEFAULT_RANGE_START_HOUR } from '../../interface';
import {
    computeRangeErrors,
    createBookingRangeNextAvailableTime,
    createTodayBookingRange,
    generateDefaultBookingRange,
    generateRecurringRanges,
    getIsBookingsIntersection,
    getIsRecurringBookingsIntersection,
    normalizeBookingRangeToTimeOfWeek,
    splitMidnightRecurringSpanningRange,
} from './rangeHelpers';

const defaultUserSettings = { WeekStart: SETTINGS_WEEK_START.MONDAY } as UserSettings;

describe('Booking range helpers', () => {
    describe('createTodayBookingRange', () => {
        it('should return undefined if after range end', () => {
            const result = createTodayBookingRange(
                new Date('2026-01-16T18:00:00Z'),
                'Europe/Zurich',
                new Date('2026-01-16T18:00:00Z'),
                30
            );

            expect(result).toEqual(undefined);
        });

        it('should return undefined if there is not enough time to create a slot', () => {
            const result = createTodayBookingRange(
                new Date('2026-01-16T16:00:00Z'),
                'Europe/Zurich',
                new Date('2026-01-16T16:00:00Z'),
                120
            );

            expect(result).toEqual(undefined);
        });

        it('should return range from the start if starts before default start', () => {
            const result = createTodayBookingRange(
                new Date('2026-01-16T06:00:00Z'),
                'Europe/Zurich',
                new Date('2026-01-16T06:00:00Z'),
                120
            );

            expect(result?.start).toEqual(new Date('2026-01-16T09:00:00Z'));
            expect(result?.end).toEqual(new Date('2026-01-16T17:00:00Z'));
        });

        it('should round the range to next hour if starts after default start', () => {
            const result = createTodayBookingRange(
                new Date('2026-01-16T08:45:00Z'),
                'Europe/Zurich',
                new Date('2026-01-16T08:45:00Z'),
                120
            );

            expect(result?.start).toEqual(new Date('2026-01-16T09:00:00Z'));
        });

        it('should round the range to next half hour if starts after default start', () => {
            const result = createTodayBookingRange(
                new Date('2026-01-16T08:23:00Z'),
                'Europe/Zurich',
                new Date('2026-01-16T08:23:00Z'),
                120
            );

            expect(result?.start).toEqual(new Date('2026-01-16T08:30:00Z'));
        });
    });

    describe('generateRecurringRanges', () => {
        it('should return no ranges if bookingRanges is empty', () => {
            const result = generateRecurringRanges(defaultUserSettings, new Date('2026-01-16T08:30:00Z'), []);

            expect(result.length).toEqual(7);
            expect(result.every((day) => day.ranges.length === 0)).toBe(true);
        });

        it('should group same-day ranges in the same day', () => {
            const result = generateRecurringRanges(defaultUserSettings, new Date('2026-01-16T08:30:00Z'), [
                {
                    start: new Date('2026-01-16T08:30:00Z'),
                    end: new Date('2026-01-16T09:30:00Z'),
                } as BookingRange,
                {
                    start: new Date('2026-01-16T11:30:00Z'),
                    end: new Date('2026-01-16T12:30:00Z'),
                } as BookingRange,
            ]);

            const rangeWithDay = result.find(
                (day) => day.date.toDateString() === new Date('2026-01-16').toDateString()
            );

            const rangeWithoutDays = result.filter(
                (day) => day.date.toDateString() !== new Date('2026-01-16').toDateString()
            );

            expect(rangeWithDay?.ranges.length).toEqual(2);
            expect(rangeWithoutDays.every((day) => day.ranges.length === 0)).toEqual(true);
        });

        it('should group ranges in separate days', () => {
            const result = generateRecurringRanges(defaultUserSettings, new Date('2026-01-16T08:30:00Z'), [
                {
                    start: new Date('2026-01-16T08:30:00Z'),
                    end: new Date('2026-01-16T09:30:00Z'),
                } as BookingRange,
                {
                    start: new Date('2026-01-17T11:30:00Z'),
                    end: new Date('2026-01-17T12:30:00Z'),
                } as BookingRange,
            ]);

            const rangeFor16 = result.find((day) => day.date.toDateString() === new Date('2026-01-16').toDateString());

            const rangeFor17 = result.find((day) => day.date.toDateString() === new Date('2026-01-17').toDateString());

            const rangeWithoutDays = result.filter(
                (day) =>
                    day.date.toDateString() !== new Date('2026-01-16').toDateString() &&
                    day.date.toDateString() !== new Date('2026-01-17').toDateString()
            );

            expect(rangeFor16?.ranges.length).toEqual(1);
            expect(rangeFor17?.ranges.length).toEqual(1);
            expect(rangeWithoutDays.length).toEqual(5);
        });
    });

    describe('generateDefaultBookingRange', () => {
        // This is a Thursday
        const today = new Date('2026-01-15T10:30:00Z');
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(today);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should create a full week range when recurring', () => {
            const result = generateDefaultBookingRange(defaultUserSettings, today, 'Europe/Zurich', 30, true);

            expect(result.length).toEqual(5);
        });

        it('should create a partial week range when non-recurring', () => {
            const result = generateDefaultBookingRange(defaultUserSettings, today, 'Europe/Zurich', 30, false);

            expect(result.length).toEqual(2);
            expect(isThursday(result[0].start)).toBe(true);
        });

        it('should create a range starting after the default start hour when non-recurring', () => {
            const result = generateDefaultBookingRange(defaultUserSettings, today, 'Europe/Zurich', 30, false);

            expect(result.length).toEqual(2);
            // We don't want the default start hour
            expect(result[0].start.getHours()).not.toBe(DEFAULT_RANGE_START_HOUR);
        });

        it('should create a range starting from the default start hour when non-recurring', () => {
            const overridenToday = new Date('2026-01-15T07:30:00Z');
            jest.useFakeTimers();
            jest.setSystemTime(overridenToday);

            const result = generateDefaultBookingRange(defaultUserSettings, overridenToday, 'Europe/Zurich', 30, false);

            expect(result.length).toEqual(2);
            expect(result[0].start.getUTCHours()).toBe(DEFAULT_RANGE_START_HOUR);
        });
    });

    describe('createBookingRangeNextAvailableTime', () => {
        // This is a Thursday
        const today = new Date('2026-01-15T10:30:00Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(today);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        const tomorrow = addDays(today, 1);
        const tomorrowStart = set(tomorrow, { hours: 9 });
        const futureMonday = set(today, { month: 1, date: 9 });

        it('should create a range for tomorrow if no range that day', () => {
            const res = createBookingRangeNextAvailableTime({
                userSettings: defaultUserSettings,
                bookingRanges: [],
                timezone: 'Europe/Zurich',
                startDate: undefined,
            });

            expect(isFriday(res.start)).toBe(true);
            expect(isSameDay(res.start, tomorrowStart)).toBe(true);
        });

        it('should take first available day after tomorrow', () => {
            const res = createBookingRangeNextAvailableTime({
                userSettings: defaultUserSettings,
                bookingRanges: [{ start: tomorrowStart } as BookingRange],
                timezone: 'Europe/Zurich',
                startDate: undefined,
            });

            expect(isSaturday(res.start)).toBe(true);
            expect(isSameDay(res.start, addDays(tomorrow, 1))).toBe(true);
        });

        it('should create range on start date if same as week start', () => {
            const res = createBookingRangeNextAvailableTime({
                userSettings: defaultUserSettings,
                bookingRanges: [],
                timezone: 'Europe/Zurich',
                startDate: futureMonday,
            });

            expect(isMonday(res.start)).toBe(true);
            expect(isSameDay(res.start, futureMonday)).toBe(true);
        });

        it('should create range on week start if start date is after week start', () => {
            const res = createBookingRangeNextAvailableTime({
                userSettings: defaultUserSettings,
                bookingRanges: [],
                timezone: 'Europe/Zurich',
                startDate: addDays(futureMonday, 2),
            });

            expect(isMonday(res.start)).toBe(true);
            expect(isSameDay(res.start, futureMonday)).toBe(true);
        });

        it('should create range first available day if week start is not availalbe', () => {
            const res = createBookingRangeNextAvailableTime({
                userSettings: defaultUserSettings,
                bookingRanges: [{ start: futureMonday } as BookingRange],
                timezone: 'Europe/Zurich',
                startDate: futureMonday,
            });

            expect(isTuesday(res.start)).toBe(true);
        });
    });

    describe('computeRangeErrors', () => {
        it('should return an error of the range is too small', () => {
            const result = computeRangeErrors(
                {
                    start: new Date('2025-12-01T09:00:00Z'),
                    end: new Date('2025-12-01T09:30:00Z'),
                } as BookingRange,
                60
            );

            expect(result.error).toEqual(BookingRangeError.TOO_SHORT);
        });

        it('should not return an error of the range is long enough', () => {
            const result = computeRangeErrors(
                {
                    start: new Date('2025-12-01T09:00:00Z'),
                    end: new Date('2025-12-01T10:00:00Z'),
                } as BookingRange,
                60
            );

            expect(result.error).toBeUndefined();
        });
    });

    describe('normalizeBookingRangeToTimeOfWeek', () => {
        // Set to Wednesday, Nov 27, 2025, 10:00 AM
        const today = new Date('2025-11-27T10:00:00Z');

        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(today);
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should reset seconds and milliseconds when normalizing across weeks', () => {
            const normalized = normalizeBookingRangeToTimeOfWeek(
                new Date('2025-12-05T14:30:45.123Z'),
                SETTINGS_WEEK_START.SUNDAY
            );

            expect(normalized.getSeconds()).toBe(0);
            expect(normalized.getMilliseconds()).toBe(0);
        });

        it('should normalize a future date to current week', () => {
            const normalized = normalizeBookingRangeToTimeOfWeek(
                new Date('2025-12-01T14:00:00Z'),
                SETTINGS_WEEK_START.SUNDAY
            );

            expect(normalized.getDate()).toBeGreaterThanOrEqual(23);
            expect(normalized.getDate()).toBeLessThanOrEqual(29);
        });

        it('should normalize a past date to current week', () => {
            const normalized = normalizeBookingRangeToTimeOfWeek(
                new Date('2025-11-18T09:30:00Z'),
                SETTINGS_WEEK_START.SUNDAY
            );

            expect(normalized.getDate()).toBeGreaterThanOrEqual(23);
            expect(normalized.getDate()).toBeLessThanOrEqual(29);
        });

        it('should preserve time when normalizing across weeks', () => {
            const inputDate = new Date('2025-12-05T14:30:45.123Z');
            const normalized = normalizeBookingRangeToTimeOfWeek(inputDate, SETTINGS_WEEK_START.SUNDAY);

            expect(normalized.getDay()).toBe(inputDate.getDay());
            expect(normalized.getHours()).toBe(inputDate.getHours());
            expect(normalized.getMinutes()).toBe(inputDate.getMinutes());
        });

        it('should handle same week dates correctly', () => {
            const thisFriday = new Date('2025-11-28T16:15:00Z');
            const normalized = normalizeBookingRangeToTimeOfWeek(thisFriday, SETTINGS_WEEK_START.SUNDAY);

            expect(isFriday(normalized)).toBe(true);
            expect(isSameDay(normalized, thisFriday)).toBe(true);
            expect(isSameHour(normalized, thisFriday)).toBe(true);
            expect(isSameMinute(normalized, thisFriday)).toBe(true);
        });

        it('should normalize correctly when week starts on Saturday', () => {
            const normalized = normalizeBookingRangeToTimeOfWeek(
                new Date('2025-12-02T14:00:00Z'),
                SETTINGS_WEEK_START.SATURDAY
            );

            expect(isTuesday(normalized)).toBe(true);
            expect(normalized.getHours()).toBe(14);
            expect(normalized.getMinutes()).toBe(0);
            expect(normalized.getDate()).toBe(25);
        });

        it('should handle Sunday when week starts on Saturday', () => {
            const normalized = normalizeBookingRangeToTimeOfWeek(
                new Date('2025-11-30T10:30:00Z'),
                SETTINGS_WEEK_START.SATURDAY
            );

            expect(isSunday(normalized)).toBe(true);

            expect(normalized.getHours()).toBe(10);
            expect(normalized.getMinutes()).toBe(30);
            expect(normalized.getDate()).toBe(23);
        });

        it('should normalize correctly when week starts on Monday', () => {
            const normalized = normalizeBookingRangeToTimeOfWeek(
                new Date('2025-11-23T11:00:00Z'),
                SETTINGS_WEEK_START.MONDAY
            );

            expect(isSunday(normalized)).toBe(true);

            expect(normalized.getHours()).toBe(11);
            expect(normalized.getMinutes()).toBe(0);
            expect(normalized.getDate()).toBe(30);
        });
    });

    describe('splitMidnightRecurringSpanningRange', () => {
        const defaultOldRange = {
            id: 'old-range-id',
            start: new Date('2025-11-23T22:00:00Z'),
            end: new Date('2025-11-24T02:00:00Z'),
            timezone: 'Europe/Zurich',
        };

        it('should return first range ending at midnight', () => {
            const result = splitMidnightRecurringSpanningRange({
                oldRange: defaultOldRange,
                normalizedStart: new Date('2025-11-23T22:00:00Z'),
                normalizedEnd: new Date('2025-11-24T02:00:00Z'),
                originalStart: new Date('2025-11-23T22:00:00Z'),
            });

            expect(result.firstRange.end).toEqual(new Date('2025-11-24T00:00:00Z'));
        });

        it('should return second range starting at midnight', () => {
            const result = splitMidnightRecurringSpanningRange({
                oldRange: defaultOldRange,
                normalizedStart: new Date('2025-11-23T22:00:00Z'),
                normalizedEnd: new Date('2025-11-24T02:00:00Z'),
                originalStart: new Date('2025-11-23T22:00:00Z'),
            });

            expect(result.secondRange.start).toEqual(new Date('2025-11-24T00:00:00Z'));
        });

        it('should preserve the original timezone in both ranges', () => {
            const result = splitMidnightRecurringSpanningRange({
                oldRange: {
                    id: 'old-range-id',
                    start: new Date('2025-11-23T23:00:00Z'),
                    end: new Date('2025-11-24T01:00:00Z'),
                    timezone: 'America/New_York',
                },
                normalizedStart: new Date('2025-11-23T23:00:00Z'),
                normalizedEnd: new Date('2025-11-24T01:00:00Z'),
                originalStart: new Date('2025-11-23T23:00:00Z'),
            });

            expect(result.firstRange.timezone).toBe('America/New_York');
            expect(result.secondRange.timezone).toBe('America/New_York');
        });

        it('should set first range start to normalized start', () => {
            const result = splitMidnightRecurringSpanningRange({
                oldRange: {
                    id: 'old-range-id',
                    start: new Date('2025-11-23T20:00:00Z'),
                    end: new Date('2025-11-24T03:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
                normalizedStart: new Date('2025-11-23T20:00:00Z'),
                normalizedEnd: new Date('2025-11-24T03:00:00Z'),
                originalStart: new Date('2025-11-23T20:00:00Z'),
            });

            expect(result.firstRange.start).toEqual(new Date('2025-11-23T20:00:00Z'));
        });

        it('should set second range end to normalized end', () => {
            const result = splitMidnightRecurringSpanningRange({
                oldRange: {
                    id: 'old-range-id',
                    start: new Date('2025-11-23T21:00:00Z'),
                    end: new Date('2025-11-24T04:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
                normalizedStart: new Date('2025-11-23T21:00:00Z'),
                normalizedEnd: new Date('2025-11-24T04:00:00Z'),
                originalStart: new Date('2025-11-23T21:00:00Z'),
            });

            expect(result.secondRange.end).toEqual(new Date('2025-11-24T04:00:00Z'));
        });

        it('should generate unique ids for first and second ranges', () => {
            const result = splitMidnightRecurringSpanningRange({
                oldRange: {
                    id: 'old-range-id',
                    start: new Date('2025-11-23T22:00:00Z'),
                    end: new Date('2025-11-24T02:00:00Z'),
                    timezone: 'Europe/Zurich',
                },
                normalizedStart: new Date('2025-11-23T22:00:00Z'),
                normalizedEnd: new Date('2025-11-24T02:00:00Z'),
                originalStart: new Date('2025-11-23T22:00:00Z'),
            });

            expect(result.firstRange.id).not.toBe(result.secondRange.id);
        });
    });

    describe('getIsBookingsIntersection', () => {
        it('should return null when no intersection exists', () => {
            const result = getIsBookingsIntersection({
                start: new Date('2025-11-23T11:00:00Z'),
                end: new Date('2025-11-23T12:00:00Z'),
                bookingRanges: [
                    {
                        id: '1',
                        start: new Date('2025-11-23T09:00:00Z'),
                        end: new Date('2025-11-23T10:00:00Z'),
                        timezone: 'Europe/Zurich',
                    },
                ],
            });

            expect(result).toBeNull();
        });

        it('should return adjusted start when new range starts within existing range', () => {
            const result = getIsBookingsIntersection({
                start: new Date('2025-11-23T10:00:00Z'),
                end: new Date('2025-11-23T12:00:00Z'),
                bookingRanges: [
                    {
                        id: '1',
                        start: new Date('2025-11-23T09:00:00Z'),
                        end: new Date('2025-11-23T11:00:00Z'),
                        timezone: 'Europe/Zurich',
                    },
                ],
            });

            expect(result?.start).toEqual(new Date('2025-11-23T11:00:00Z'));
        });

        it('should preserve original end when new range starts within existing range', () => {
            const result = getIsBookingsIntersection({
                start: new Date('2025-11-23T10:00:00Z'),
                end: new Date('2025-11-23T12:00:00Z'),
                bookingRanges: [
                    {
                        id: '1',
                        start: new Date('2025-11-23T09:00:00Z'),
                        end: new Date('2025-11-23T11:00:00Z'),
                        timezone: 'Europe/Zurich',
                    },
                ],
            });

            expect(result?.end).toEqual(new Date('2025-11-23T12:00:00Z'));
        });

        it('should return adjusted end when new range ends within existing range', () => {
            const result = getIsBookingsIntersection({
                start: new Date('2025-11-23T09:00:00Z'),
                end: new Date('2025-11-23T12:00:00Z'),
                bookingRanges: [
                    {
                        id: '1',
                        start: new Date('2025-11-23T11:00:00Z'),
                        end: new Date('2025-11-23T13:00:00Z'),
                        timezone: 'Europe/Zurich',
                    },
                ],
            });

            expect(result?.end).toEqual(new Date('2025-11-23T11:00:00Z'));
        });

        it('should preserve original start when new range ends within existing range', () => {
            const result = getIsBookingsIntersection({
                start: new Date('2025-11-23T09:00:00Z'),
                end: new Date('2025-11-23T12:00:00Z'),
                bookingRanges: [
                    {
                        id: '1',
                        start: new Date('2025-11-23T11:00:00Z'),
                        end: new Date('2025-11-23T13:00:00Z'),
                        timezone: 'Europe/Zurich',
                    },
                ],
            });

            expect(result?.start).toEqual(new Date('2025-11-23T09:00:00Z'));
        });

        it('should return null when new range completely engulfs existing range', () => {
            const result = getIsBookingsIntersection({
                start: new Date('2025-11-23T09:00:00Z'),
                end: new Date('2025-11-23T12:00:00Z'),
                bookingRanges: [
                    {
                        id: '1',
                        start: new Date('2025-11-23T10:00:00Z'),
                        end: new Date('2025-11-23T11:00:00Z'),
                        timezone: 'Europe/Zurich',
                    },
                ],
            });

            expect(result).toBeNull();
        });
    });

    describe('getIsRecurringBookingsIntersection', () => {
        const defaultBookingRanges: BookingRange[] = [
            {
                id: '1',
                start: new Date('2025-11-24T09:00:00Z'),
                end: new Date('2025-11-24T10:00:00Z'),
                timezone: 'Europe/Zurich',
            },
        ];

        it('should return null when no intersection on the same weekday', () => {
            // User tries to add: Tuesday next week, 11-12 AM (different day)
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-02T11:00:00Z'),
                end: new Date('2025-12-02T12:00:00Z'),
                bookingRanges: defaultBookingRanges,
                weekStart: SETTINGS_WEEK_START.SUNDAY,
            });

            expect(result).toBeNull();
        });

        it('should return null when adding range on future weekday with no overlap', () => {
            // User tries to add: Monday next week, 11-12 AM (same day, no time overlap)
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-01T11:00:00Z'),
                end: new Date('2025-12-01T12:00:00Z'),
                bookingRanges: defaultBookingRanges,
                weekStart: SETTINGS_WEEK_START.SUNDAY,
            });

            expect(result).toBeNull();
        });

        it('should detect intersection across different weeks with same weekday and overlapping times', () => {
            // User tries to add: Monday next week, 9:30-11 AM
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-01T09:30:00Z'),
                end: new Date('2025-12-01T11:00:00Z'),
                bookingRanges: defaultBookingRanges,
                weekStart: SETTINGS_WEEK_START.SUNDAY,
            });

            expect(result).not.toBeNull();
        });

        it('should adjust intersection at the end of existing range, preserving original week', () => {
            // User tries to add: Monday next week, 9:30-11 AM
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-01T09:30:00Z'),
                end: new Date('2025-12-01T11:00:00Z'),
                bookingRanges: defaultBookingRanges,
                weekStart: SETTINGS_WEEK_START.SUNDAY,
            });

            // Should suggest: Monday Dec 1, 10:00-11:00 AM (same week as user's selection)
            expect(result).not.toBeNull();
            expect(result?.start.getTime()).toBe(new Date('2025-12-01T10:00:00Z').getTime());
            expect(result?.end.getTime()).toBe(new Date('2025-12-01T11:00:00Z').getTime());
        });

        it('should handle ranges from past weeks correctly', () => {
            // User tries to add: Monday last week, 9:30-11 AM
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-11-17T09:30:00Z'),
                end: new Date('2025-11-17T11:00:00Z'),
                bookingRanges: defaultBookingRanges,
                weekStart: SETTINGS_WEEK_START.SUNDAY,
            });

            // Should suggest: Monday Nov 17, 10:00-11:00 AM (preserves user's selected week)
            expect(result).not.toBeNull();
            expect(result?.start.getTime()).toBe(new Date('2025-11-17T10:00:00Z').getTime());
            expect(result?.end.getTime()).toBe(new Date('2025-11-17T11:00:00Z').getTime());
        });

        it('should adjust intersection at the start of existing range, preserving original week', () => {
            // User tries to add: Monday next week, 9-10:30 AM
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-01T09:00:00Z'),
                end: new Date('2025-12-01T10:30:00Z'),
                bookingRanges: [
                    {
                        id: '1',
                        start: new Date('2025-11-24T10:00:00Z'),
                        end: new Date('2025-11-24T11:00:00Z'),
                        timezone: 'Europe/Zurich',
                    },
                ],
                weekStart: SETTINGS_WEEK_START.SUNDAY,
            });

            // Should suggest: Monday Dec 1, 9:00-10:00 AM (same week as user's selection)
            expect(result).not.toBeNull();
            expect(result?.start.getTime()).toBe(new Date('2025-12-01T09:00:00Z').getTime());
            expect(result?.end.getTime()).toBe(new Date('2025-12-01T10:00:00Z').getTime());
        });

        it('should return null when new range completely engulfs existing range', () => {
            // User tries to add: Monday next week, 9-12 PM (completely contains existing range)
            const result = getIsRecurringBookingsIntersection({
                start: new Date('2025-12-01T09:00:00Z'),
                end: new Date('2025-12-01T12:00:00Z'),
                bookingRanges: [
                    {
                        id: '1',
                        start: new Date('2025-11-24T10:00:00Z'),
                        end: new Date('2025-11-24T11:00:00Z'),
                        timezone: 'Europe/Zurich',
                    },
                ],
                weekStart: SETTINGS_WEEK_START.SUNDAY,
            });

            expect(result).toBeNull();
        });
    });
});
