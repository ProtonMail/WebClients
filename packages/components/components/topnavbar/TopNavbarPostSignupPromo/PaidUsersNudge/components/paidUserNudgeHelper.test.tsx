import { subDays, subHours } from 'date-fns';

import { HIDE_OFFER, OfferDuration, ReminderDates } from '../components/interface';
import { isInWindow, isLastDayOfWindow, roundToUpper, shouldOpenReminder } from './paidUserNudgeHelper';

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
});
