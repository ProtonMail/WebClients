import { markRemindersAsSeen, shouldDisplayReminder } from './cancellationReminderHelper';

describe('markRemindersAsSeen', () => {
    it('Should return undefined when no data passed', () => {
        const result = markRemindersAsSeen({});
        expect(result).toStrictEqual({});
    });

    // The default value of the flag is an empty array, we prevent calling the function in the code
    // but this tests makes sure that giving it an array won't break anything
    it('Should return empty object if an array is passed', () => {
        const result = markRemindersAsSeen([] as any);
        expect(result).toStrictEqual({});
    });

    it('Should return the same object if all values are at 2', () => {
        const toTest = { 'day-45': 2, 'day-30': 2 };
        const result = markRemindersAsSeen(toTest);
        expect(result).toStrictEqual(toTest);
    });

    it('Should change a single 1 to the value of 2', () => {
        const toTest = { 'day-45': 2, 'day-30': 1 };
        const result = markRemindersAsSeen(toTest);
        expect(result).toStrictEqual({ ...toTest, 'day-30': 2 });
    });

    it('Should change multiple 1 to the value of 2', () => {
        const toTest = { 'day-45': 2, 'day-30': 1, 'day-7': 1 };
        const result = markRemindersAsSeen(toTest);
        expect(result).toStrictEqual({ ...toTest, 'day-30': 2, 'day-7': 2 });
    });

    it('Should not change value if the number is unexpected', () => {
        const toTest = { 'day-45': 2, 'day-30': 0 };
        const result = markRemindersAsSeen(toTest);
        expect(result).toStrictEqual({ ...toTest });
    });

    it('Should not change value if the number is unexpected but change all 1 to 2', () => {
        const toTest = { 'day-45': 2, 'day-30': 0, 'day-7': 1 };
        const result = markRemindersAsSeen(toTest);
        expect(result).toStrictEqual({ ...toTest, 'day-7': 2 });
    });
});

describe('shouldDisplayReminder', () => {
    it('Should return false when no data passed', () => {
        const result = shouldDisplayReminder({});
        expect(result).toBe(false);
    });

    it('Should return false when all values are at 2', () => {
        const toTest = { 'day-45': 2, 'day-30': 2 };
        const result = shouldDisplayReminder(toTest);
        expect(result).toBe(false);
    });

    it('Should return true when a single value is at 1', () => {
        const toTest = { 'day-45': 2, 'day-30': 1 };
        const result = shouldDisplayReminder(toTest);
        expect(result).toBe(true);
    });

    it('Should return true when multiple values are at 1', () => {
        const toTest = { 'day-45': 2, 'day-30': 1, 'day-7': 1 };
        const result = shouldDisplayReminder(toTest);
        expect(result).toBe(true);
    });

    it('Should return false when all values are at 0', () => {
        const toTest = { 'day-45': 0, 'day-30': 0 };
        const result = shouldDisplayReminder(toTest);
        expect(result).toBe(false);
    });

    it('Should return true when a single value is at 1 and the rest at 0', () => {
        const toTest = { 'day-45': 0, 'day-30': 1 };
        const result = shouldDisplayReminder(toTest);
        expect(result).toBe(true);
    });
});
