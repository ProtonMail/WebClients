import { getUnixTime } from 'date-fns';

import { TIME_PERIOD } from '../interface';
import { getStartTimeFromTimePeriod } from './getStartTimeFromTimePeriod';

describe('getStartTimeFromTimePeriod', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2026-10-01T12:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return undefined when importing all messages', () => {
        expect(getStartTimeFromTimePeriod(TIME_PERIOD.BIG_BANG)).toBeUndefined();
    });

    it.each([
        [TIME_PERIOD.LAST_YEAR, '2025-10-01T12:00:00Z'],
        [TIME_PERIOD.LAST_6_MONTHS, '2026-04-01T12:00:00Z'],
        [TIME_PERIOD.LAST_3_MONTHS, '2026-07-01T12:00:00Z'],
        [TIME_PERIOD.LAST_MONTH, '2026-09-01T12:00:00Z'],
    ])('should return the unix time for %s', (period, expectedDate) => {
        expect(getStartTimeFromTimePeriod(period)).toBe(getUnixTime(new Date(expectedDate)));
    });
});
