import { addDays, isFriday, isMonday, isSameDay, isSaturday, isTuesday, isWeekend, set } from 'date-fns';

import type { UserSettings } from '@proton/shared/lib/interfaces';
import { SETTINGS_WEEK_START } from '@proton/shared/lib/interfaces';

import type { BookingRange } from '../../bookingsProvider/interface';
import { createBookingRangeNextAvailableTime, generateDefaultBookingRange } from './rangeHelpers';

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
});
