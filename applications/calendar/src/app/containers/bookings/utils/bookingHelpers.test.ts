import { addDays, addHours, isFriday, isMonday, isSaturday, isWeekend, set } from 'date-fns';

import { isSameDay } from '@proton/shared/lib/date-fns-utc';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { SETTINGS_WEEK_START } from '@proton/shared/lib/interfaces';

import type { BookingRange } from '../bookingsProvider/interface';
import { type BookingFormData, BookingFormValidationReasons, BookingLocation } from '../bookingsProvider/interface';
import {
    JSONFormatData,
    JSONFormatTextData,
    createBookingRangeNextAvailableTime,
    generateBookingRangeID,
    generateDefaultBookingRange,
    generateSlotsFromRange,
    validateFormData,
} from './bookingHelpers';

describe('booking helpers', () => {
    describe('generateSlotsFromRange', () => {
        const startDate = new Date(2025, 0, 1, 10, 0, 0);

        it('should create one event when one hour available', () => {
            const slots = generateSlotsFromRange({
                rangeID: 'rangeID',
                start: startDate,
                end: addHours(startDate, 1),
                duration: 60,
                timezone: 'timezone',
            });

            expect(slots).toHaveLength(1);
        });

        it('should create two events when two hours available', () => {
            const slots = generateSlotsFromRange({
                rangeID: 'rangeID',
                start: startDate,
                end: addHours(startDate, 2),
                duration: 60,
                timezone: 'timezone',
            });

            expect(slots).toHaveLength(2);
        });

        it('should create one event when two hours available for 1.5 hours slot', () => {
            const slots = generateSlotsFromRange({
                rangeID: 'rangeID',
                start: startDate,
                end: addHours(startDate, 2),
                duration: 90,
                timezone: 'timezone',
            });

            expect(slots).toHaveLength(1);
        });

        it('should return 0 events when one hour available for 1.5 hours slot', () => {
            const slots = generateSlotsFromRange({
                rangeID: 'rangeID',
                start: startDate,
                end: addHours(startDate, 1),
                duration: 90,
                timezone: 'timezone',
            });

            expect(slots).toHaveLength(0);
        });
    });

    describe('JSONFormatData', () => {
        it('should always return the same formatted data', () => {
            const formattedOne = JSONFormatData({
                description: 'description',
                location: 'location',
                summary: 'summary',
                withProtonMeetLink: true,
            });
            const formattedTwo = JSONFormatData({
                description: 'description',
                summary: 'summary',
                location: 'location',
                withProtonMeetLink: true,
            });

            const formattedThree = JSONFormatData({
                summary: 'summary',
                description: 'description',
                location: 'location',
                withProtonMeetLink: true,
            });

            expect(formattedOne).toEqual(formattedTwo);
            expect(formattedOne).toEqual(formattedThree);
        });
    });

    describe('JSONFormatTextData', () => {
        it('should always return the same formatted data', () => {
            const formattedOne = JSONFormatTextData({
                EndTime: 10000,
                RRule: 'rrule',
                StartTime: 5000,
                Timezone: 'timezone',
            });
            const formattedTwo = JSONFormatTextData({
                EndTime: 10000,
                RRule: 'rrule',
                Timezone: 'timezone',
                StartTime: 5000,
            });

            const formattedThree = JSONFormatTextData({
                EndTime: 10000,
                Timezone: 'timezone',
                RRule: 'rrule',
                StartTime: 5000,
            });

            const formattedFour = JSONFormatTextData({
                Timezone: 'timezone',
                EndTime: 10000,
                RRule: 'rrule',
                StartTime: 5000,
            });

            expect(formattedOne).toEqual(formattedTwo);
            expect(formattedOne).toEqual(formattedThree);
            expect(formattedOne).toEqual(formattedFour);
        });
    });

    describe('validateFormData', () => {
        const validForm: BookingFormData = {
            title: 'Page title',
            selectedCalendar: null,
            locationType: BookingLocation.MEET,
            duration: 60,
            timezone: 'Europe/Zurich',
            bookingSlots: [
                {
                    id: '10',
                    rangeID: 'rangeID',
                    start: new Date(),
                    end: new Date(),
                    timezone: 'Europe/Zurich',
                },
            ],
        };

        it('should return true if the form is valid', () => {
            const result = validateFormData(validForm);

            expect(result).toEqual(undefined);
        });

        it('should return warning if no title', () => {
            const result = validateFormData({ ...validForm, title: '' });

            expect(result).toEqual({
                type: 'warning',
                reason: BookingFormValidationReasons.TITLE_REQUIRED,
            });
        });

        it('should return warning if title only has spaces title', () => {
            const result = validateFormData({ ...validForm, title: '  ' });

            expect(result).toEqual({
                type: 'warning',
                reason: BookingFormValidationReasons.TITLE_REQUIRED,
            });
        });

        it('should return error if no booking slot', () => {
            const result = validateFormData({ ...validForm, bookingSlots: [] });

            expect(result).toEqual({
                type: 'warning',
                reason: BookingFormValidationReasons.TIME_SLOT_REQUIRED,
            });
        });
    });

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
            const res = generateDefaultBookingRange(userSettings, 'Europe/Zurich', new Date());
            checks(res);
        });

        it('should return the correct range when week starts on Saturday', () => {
            const userSettings = { WeekStart: SETTINGS_WEEK_START.SATURDAY } as UserSettings;
            const res = generateDefaultBookingRange(userSettings, 'Europe/Zurich', new Date());
            checks(res);
        });

        it('should return the correct range when week starts on Sunday', () => {
            const userSettings = { WeekStart: SETTINGS_WEEK_START.SUNDAY } as UserSettings;
            const res = generateDefaultBookingRange(userSettings, 'Europe/Zurich', new Date());
            checks(res);
        });
    });

    describe('createBookingRangeNextAvailableTime', () => {
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
        const tomorrowEnd = set(tomorrow, { hours: 17 });

        const tomorrowRange = {
            id: generateBookingRangeID(tomorrowStart, tomorrowEnd),
            start: tomorrowStart,
            end: tomorrowEnd,
            timezone: 'Europe/Zurich',
        };

        const twoDaysAfterTomorrow = addDays(tomorrow, 2);
        const twoDaysAfterTomorrowStart = set(twoDaysAfterTomorrow, { hours: 9 });
        const twoDaysAfterTomorrowEnd = set(twoDaysAfterTomorrow, { hours: 17 });

        const dayAfterTomorrowRange = {
            id: generateBookingRangeID(twoDaysAfterTomorrowStart, twoDaysAfterTomorrowEnd),
            start: twoDaysAfterTomorrowStart,
            end: twoDaysAfterTomorrowEnd,
            timezone: 'Europe/Zurich',
        };

        it('should return tomorrow if tomorrow is available', () => {
            const res = createBookingRangeNextAvailableTime([], 'Europe/Zurich');
            expect(isSameDay(res.start, tomorrow)).toBe(true);
            expect(isSameDay(res.end, tomorrow)).toBe(true);
            expect(isFriday(res.start)).toBe(true);
        });

        it('should return the day after tomorrow if tomorrow is not available', () => {
            const res = createBookingRangeNextAvailableTime([tomorrowRange], 'Europe/Zurich');
            expect(isSameDay(res.start, new Date('2026-01-17T08:00:00Z'))).toBe(true);
            expect(isSameDay(res.end, new Date('2026-01-17T08:00:00Z'))).toBe(true);
            expect(isSaturday(res.start)).toBe(true);
        });

        it('should return the date in-between tomorrow and the day after if both are taken', () => {
            const res = createBookingRangeNextAvailableTime([tomorrowRange, dayAfterTomorrowRange], 'Europe/Zurich');
            expect(isSameDay(res.start, new Date('2026-01-17T14:00:00Z'))).toBe(true);
            expect(isSameDay(res.end, new Date('2026-01-17T14:00:00Z'))).toBe(true);
            expect(isSaturday(res.start)).toBe(true);
        });
    });
});
