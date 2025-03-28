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
    [{ day: 14, expected: false }],
    [{ day: 20, expected: true }],
    [{ day: 27, expected: true }],
    [{ day: 80, expected: true }],
    [{ day: 600, expected: false }],
];

const lastWindowDayTests = [
    [{ day: 14, expected: false }],
    [{ day: ReminderDates.day20 + OfferDuration - 2, expected: false }],
    [{ day: ReminderDates.day20 + OfferDuration - 1, expected: true }],
    [{ day: ReminderDates.day80 + OfferDuration - 1, expected: true }],
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
    [{ day: subDays(today, 26).getTime() / 1000, flag: HIDE_OFFER, expected: false }],
    [{ day: subDays(today, 26).getTime() / 1000, flag: 0, expected: true }],
    // Last day of offer so no reminder
    [{ day: subDays(today, 27).getTime() / 1000, flag: 0, expected: false }],
    [{ day: subDays(today, 26).getTime() / 1000, flag: subDays(today, 2).getTime() / 1000, expected: true }],
    [{ day: subDays(today, 26).getTime() / 1000, flag: subHours(today, 2).getTime() / 1000, expected: false }],
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
            expect(getWindowEndDate(15)).toBeNull();
        });

        it('returns correct date for first day of window', () => {
            // ReminderDates.day20 (20) + OfferDuration (7) - 20 = 7 days remaining
            const expected = startOfDay(addDays(mockDate, 7));
            expect(getWindowEndDate(20)).toEqual(expected);
        });

        it('returns correct date for middle of window', () => {
            // ReminderDates.day20 (20) + OfferDuration (7) - 23 = 4 days remaining
            const expected = startOfDay(addDays(mockDate, 4));
            expect(getWindowEndDate(23)).toEqual(expected);
        });

        it('returns correct date for last day of window', () => {
            // ReminderDates.day20 (20) + OfferDuration (7) - 26 = 1 day remaining
            const expected = startOfDay(addDays(mockDate, 1));
            expect(getWindowEndDate(26)).toEqual(expected);
        });

        it('returns correct date in different window periods', () => {
            // Test window at day 80
            // ReminderDates.day80 (80) + OfferDuration (7) - 83 = 4 days remaining
            const expected = startOfDay(addDays(mockDate, 4));
            expect(getWindowEndDate(83)).toEqual(expected);
        });
    });
});
