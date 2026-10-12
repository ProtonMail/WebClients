import { addDays, startOfDay, subDays, subHours } from 'date-fns';

import { HIDE_OFFER, OfferDuration, ReminderDates } from '../helpers/interface';
import {
    getWindowEndDate,
    isInWindow,
    isLastDayOfWindow,
    roundToUpper,
    shouldOpenReminder,
} from './paidUserNudgeHelper';

const today = new Date();

const windowTests = [
    [{ day: 9, expected: false }],
    [{ day: 10, expected: true }],
    [{ day: 17, expected: true }],
    [{ day: 18, expected: false }],
    [{ day: 40, expected: true }],
    [{ day: 47, expected: true }],
    [{ day: 48, expected: false }],
    // No reminders after the second window
    [{ day: 80, expected: false }],
    [{ day: 600, expected: false }],
];

const lastWindowDayTests = [
    [{ day: 9, expected: false }],
    [{ day: ReminderDates.day10 + OfferDuration - 2, expected: false }],
    [{ day: ReminderDates.day10 + OfferDuration - 1, expected: true }],
    [{ day: ReminderDates.day40 + OfferDuration - 1, expected: true }],
    [{ day: 80 + OfferDuration - 1, expected: false }],
];

const roundingTest = [
    [{ value: 499, expected: 500 }],
    [{ value: 500, expected: 500 }],
    [{ value: 4899, expected: 4900 }],
    [{ value: 4888, expected: 4900 }],
    [{ value: 4323, expected: 4400 }],
    [{ value: 15588, expected: 15600 }],
    [{ value: 155890, expected: 155900 }],
];

const reminderShowData = [
    // Last day but hide offer
    [{ day: subDays(today, 16).getTime() / 1000, flag: HIDE_OFFER, expected: false }],
    [{ day: subDays(today, 16).getTime() / 1000, flag: 0, expected: true }],
    // Last day of offer so no reminder
    [{ day: subDays(today, 17).getTime() / 1000, flag: 0, expected: false }],
    [{ day: subDays(today, 16).getTime() / 1000, flag: subDays(today, 2).getTime() / 1000, expected: true }],
    [{ day: subDays(today, 16).getTime() / 1000, flag: subHours(today, 2).getTime() / 1000, expected: false }],
    // No reminders after the second window
    [{ day: subDays(today, 86).getTime() / 1000, flag: 0, expected: false }],
];

describe('Mail Paid user nudge', () => {
    describe('Offer window tests', () => {
        it.each(windowTests)('testing offer window for %s', (obj) => {
            expect(isInWindow(obj.day)).toBe(obj.expected);
        });
    });

    describe('Is last day of window', () => {
        it.each(lastWindowDayTests)('testing last offer day window for %s', (obj) => {
            expect(isLastDayOfWindow(obj.day)).toBe(obj.expected);
        });
    });

    describe('Should display reminder', () => {
        it.each(reminderShowData)('testing last offer day window for %s', (obj) => {
            expect(shouldOpenReminder(obj.day, obj.flag)).toBe(obj.expected);
        });
    });

    describe('Number ceiling', () => {
        it.each(roundingTest)('testing last offer day window for %s', (obj) => {
            expect(roundToUpper(obj.value)).toBe(obj.expected);
        });
    });

    describe('Window end date', () => {
        const mockDate = new Date('2025-02-26T12:00:00Z');

        beforeEach(() => {
            jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('returns null when not in a window', () => {
            expect(getWindowEndDate(20)).toBeNull();
        });

        it('returns correct date for first day of window', () => {
            // ReminderDates.day10 (10) + OfferDuration (7) - 10 = 7 days remaining
            const expected = startOfDay(addDays(mockDate, 7));
            expect(getWindowEndDate(10)).toEqual(expected);
        });

        it('returns correct date for middle of window', () => {
            // ReminderDates.day10 (10) + OfferDuration (7) - 13 = 4 days remaining
            const expected = startOfDay(addDays(mockDate, 4));
            expect(getWindowEndDate(13)).toEqual(expected);
        });

        it('returns correct date for last day of window', () => {
            // ReminderDates.day10 (10) + OfferDuration (7) - 16 = 1 day remaining
            const expected = startOfDay(addDays(mockDate, 1));
            expect(getWindowEndDate(16)).toEqual(expected);
        });

        it('returns correct date in different window periods', () => {
            // Test window at day 40
            // ReminderDates.day40 (40) + OfferDuration (7) - 43 = 4 days remaining
            const expected = startOfDay(addDays(mockDate, 4));
            expect(getWindowEndDate(43)).toEqual(expected);
        });

        it('returns null after the last window', () => {
            expect(getWindowEndDate(83)).toBeNull();
        });
    });
});
