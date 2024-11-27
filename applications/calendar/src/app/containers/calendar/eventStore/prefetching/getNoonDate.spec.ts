import { getNoonDate } from './getNoonDate';

describe('getNoonDate()', () => {
    test.each([
        { date: '2024-10-15T00:00:00.000Z', expected: '2024-10-15T12:00:00.000Z', isStartOfDay: true },
        { date: '2024-10-15T23:59:59.000Z', expected: '2024-10-15T11:59:59.000Z', isStartOfDay: false },
    ])(
        'given isStartOfDay is $isStartOfDay, should return the correct noon time',
        ({ date, expected, isStartOfDay }) => {
            expect(getNoonDate(new Date(date), isStartOfDay)).toEqual(new Date(expected));
        }
    );
});
