import {
    addDays,
    addMonths,
    addWeeks,
    addYears,
    endOfMonth,
    endOfYear,
    getDaysInMonth,
    isNextDay,
    isSameDay,
    isSameMonth,
    isSameYear,
    max,
    min,
    startOfMonth,
    startOfYear,
} from '../../lib/date-fns-utc';
import differenceInCalendarDays from '../../lib/date-fns-utc/differenceInCalendarDays';
import differenceInCalendarWeeks from '../../lib/date-fns-utc/differenceInCalendarWeeks';
import differenceInCalendarYears from '../../lib/date-fns-utc/differenceInCalendarYears';
import eachDayOfInterval from '../../lib/date-fns-utc/eachDayOfInterval';
import endOfDay from '../../lib/date-fns-utc/endOfDay';
import endOfWeek from '../../lib/date-fns-utc/endOfWeek';
import startOfDay from '../../lib/date-fns-utc/startOfDay';
import startOfWeek from '../../lib/date-fns-utc/startOfWeek';

// Most dates sit near UTC midnight, where the local day differs in Los Angeles and Kiritimati, so a helper that
// accidentally works in local time fails when test:ci runs this file in those zones.
const utc = (iso: string) => new Date(`${iso}Z`);

describe('date-fns-utc helpers', () => {
    describe('start and end of a period', () => {
        it('should use the UTC day', () => {
            expect(startOfDay(utc('2019-10-27T23:30:00'))).toEqual(utc('2019-10-27T00:00:00'));
            expect(endOfDay(utc('2019-10-27T00:30:00'))).toEqual(utc('2019-10-27T23:59:59.999'));
        });

        it('should use the UTC week and honour weekStartsOn', () => {
            const sundayNight = utc('2024-03-10T23:30:00');
            expect(startOfWeek(sundayNight)).toEqual(utc('2024-03-10T00:00:00'));
            expect(startOfWeek(sundayNight, { weekStartsOn: 1 })).toEqual(utc('2024-03-04T00:00:00'));
            expect(endOfWeek(sundayNight)).toEqual(utc('2024-03-16T23:59:59.999'));
            expect(endOfWeek(sundayNight, { weekStartsOn: 1 })).toEqual(utc('2024-03-10T23:59:59.999'));
        });

        it('should use the UTC month and year', () => {
            const leapDayNight = utc('2024-02-29T23:30:00');
            expect(startOfMonth(leapDayNight)).toEqual(utc('2024-02-01T00:00:00'));
            expect(endOfMonth(utc('2024-02-01T00:30:00'))).toEqual(utc('2024-02-29T23:59:59.999'));
            expect(startOfYear(utc('2024-12-31T23:30:00'))).toEqual(utc('2024-01-01T00:00:00'));
            expect(endOfYear(utc('2024-01-01T00:30:00'))).toEqual(utc('2024-12-31T23:59:59.999'));
        });

        it('should count the days in the UTC month', () => {
            expect(getDaysInMonth(utc('2024-02-29T23:30:00'))).toBe(29);
            expect(getDaysInMonth(utc('2023-02-01T00:30:00'))).toBe(28);
        });
    });

    describe('adding', () => {
        it('should add whole UTC days, weeks, months and years across DST changes', () => {
            expect(addDays(utc('2019-03-30T23:30:00'), 1)).toEqual(utc('2019-03-31T23:30:00'));
            expect(addWeeks(utc('2019-10-21T23:30:00'), 1)).toEqual(utc('2019-10-28T23:30:00'));
            expect(addMonths(utc('2019-03-15T23:30:00'), 1)).toEqual(utc('2019-04-15T23:30:00'));
            expect(addYears(utc('2019-03-15T23:30:00'), -1)).toEqual(utc('2018-03-15T23:30:00'));
        });

        it('should clamp to the end of shorter months', () => {
            expect(addMonths(utc('2024-01-31T23:30:00'), 1)).toEqual(utc('2024-02-29T23:30:00'));
            expect(addYears(utc('2024-02-29T00:30:00'), 1)).toEqual(utc('2025-02-28T00:30:00'));
        });

        it('should return plain Dates', () => {
            const date = utc('2024-01-31T23:30:00');
            for (const result of [addDays(date, 1), addMonths(date, 1), startOfDay(date), startOfWeek(date)]) {
                expect(Object.getPrototypeOf(result)).toBe(Date.prototype);
            }
        });
    });

    describe('comparing', () => {
        it('should compare UTC days', () => {
            expect(isSameDay(utc('2024-03-10T00:00:00'), utc('2024-03-10T23:59:59.999'))).toBe(true);
            expect(isSameDay(utc('2024-03-10T23:59:59.999'), utc('2024-03-11T00:00:00'))).toBe(false);
            expect(isSameDay(new Date(NaN), new Date(NaN))).toBe(false);
        });

        it('should compare UTC months and years', () => {
            expect(isSameMonth(utc('2024-03-01T00:00:00'), utc('2024-03-31T23:59:59.999'))).toBe(true);
            expect(isSameMonth(utc('2024-03-31T23:59:59.999'), utc('2024-04-01T00:00:00'))).toBe(false);
            expect(isSameMonth(utc('2023-03-15T12:00:00'), utc('2024-03-15T12:00:00'))).toBe(false);
            expect(isSameYear(utc('2024-01-01T00:00:00'), utc('2024-12-31T23:59:59.999'))).toBe(true);
            expect(isSameYear(utc('2024-12-31T23:59:59.999'), utc('2025-01-01T00:00:00'))).toBe(false);
        });

        it('should tell whether the second date is on the next UTC day', () => {
            expect(isNextDay(utc('2024-03-10T23:59:59.999'), utc('2024-03-11T00:00:00'))).toBe(true);
            expect(isNextDay(utc('2024-03-10T00:00:00'), utc('2024-03-11T23:59:59.999'))).toBe(true);
            expect(isNextDay(utc('2024-03-10T00:00:00'), utc('2024-03-10T23:59:59.999'))).toBe(false);
            expect(isNextDay(utc('2024-03-10T12:00:00'), utc('2024-03-12T00:00:00'))).toBe(false);
            expect(isNextDay(utc('2024-03-11T00:00:00'), utc('2024-03-10T12:00:00'))).toBe(false);
        });

        it('should return the original object from min and max', () => {
            const earlier = utc('2024-03-10T00:00:00');
            const later = utc('2024-03-11T00:00:00');
            expect(min(earlier, later)).toBe(earlier);
            expect(min(later, earlier)).toBe(earlier);
            expect(max(earlier, later)).toBe(later);
            expect(max(later, earlier)).toBe(later);
        });
    });

    describe('differences', () => {
        it('should count UTC calendar days', () => {
            expect(differenceInCalendarDays(utc('2024-03-11T00:00:00'), utc('2024-03-10T23:59:59.999'))).toBe(1);
            expect(differenceInCalendarDays(utc('2019-04-01T00:30:00'), utc('2019-03-01T23:30:00'))).toBe(31);
            expect(differenceInCalendarDays(utc('2024-03-10T00:00:00'), utc('2024-03-12T23:00:00'))).toBe(-2);
        });

        it('should count whole 7-day spans, not week boundaries', () => {
            expect(differenceInCalendarWeeks(utc('2024-03-17T00:00:00'), utc('2024-03-10T23:59:59.999'))).toBe(1);
            expect(differenceInCalendarWeeks(utc('2024-03-23T00:00:00'), utc('2024-03-10T00:00:00'))).toBe(1);
            expect(differenceInCalendarWeeks(utc('2024-03-11T00:00:00'), utc('2024-03-09T00:00:00'))).toBe(0);
            expect(differenceInCalendarWeeks(utc('2024-03-09T00:00:00'), utc('2024-03-10T00:00:00'))).toBe(-1);
        });

        it('should count UTC calendar years', () => {
            expect(differenceInCalendarYears(utc('2025-01-01T00:00:00'), utc('2024-12-31T23:59:59.999'))).toBe(1);
            expect(differenceInCalendarYears(utc('2024-12-31T23:59:59.999'), utc('2024-01-01T00:00:00'))).toBe(0);
        });
    });

    describe('eachDayOfInterval', () => {
        it('should list the UTC days of the interval', () => {
            expect(eachDayOfInterval(utc('2024-03-09T12:00:00'), utc('2024-03-11T01:00:00'))).toEqual([
                utc('2024-03-09T00:00:00'),
                utc('2024-03-10T00:00:00'),
                utc('2024-03-11T00:00:00'),
            ]);
            expect(eachDayOfInterval(utc('2024-03-10T23:59:59.999'), utc('2024-03-10T23:59:59.999'))).toEqual([
                utc('2024-03-10T00:00:00'),
            ]);
        });

        it('should throw on a reversed or invalid interval', () => {
            expect(() => eachDayOfInterval(utc('2024-03-11T00:00:00'), utc('2024-03-10T00:00:00'))).toThrow(RangeError);
            expect(() => eachDayOfInterval(new Date(NaN), utc('2024-03-10T00:00:00'))).toThrow(RangeError);
        });
    });
});
