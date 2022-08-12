import { act, renderHook } from '@testing-library/react-hooks';

import { DAY, HOUR, MINUTE, SECOND } from '@proton/shared/lib/constants';

import useDateCountdown from './useDateCountdown';

describe('useDateCountdown', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    describe('interval', () => {
        it('should default interval to update every second', () => {
            const diff = 123456789;
            const expiry = new Date(Date.now() + diff);
            const { result } = renderHook(() => useDateCountdown(expiry));

            const initialExpectedValue = {
                days: 1,
                diff,
                expired: false,
                hours: 10,
                minutes: 17,
                seconds: 36,
            };
            expect(result.current).toStrictEqual(initialExpectedValue);

            // fast-forward time until 1 millisecond before it should be updated
            act(() => {
                jest.advanceTimersByTime(SECOND - 1);
            });
            expect(result.current).toStrictEqual(initialExpectedValue);

            // fast-forward until 1st update should be
            act(() => {
                jest.advanceTimersByTime(1);
            });
            expect(result.current).toStrictEqual({ ...initialExpectedValue, diff: diff - SECOND, seconds: 35 });
        });

        it('should allow configuration of interval', () => {
            const diff = 123456789;
            const interval = 500;
            const expiry = new Date(Date.now() + diff);
            const { result } = renderHook(() => useDateCountdown(expiry, { interval }));

            const initialExpectedValue = {
                days: 1,
                diff,
                expired: false,
                hours: 10,
                minutes: 17,
                seconds: 36,
            };
            expect(result.current).toStrictEqual(initialExpectedValue);

            // fast-forward time until 1 millisecond before it should be updated
            act(() => {
                jest.advanceTimersByTime(interval - 1);
            });
            expect(result.current).toStrictEqual(initialExpectedValue);

            // fast-forward until 1st update should be
            act(() => {
                jest.advanceTimersByTime(1);
            });
            expect(result.current).toStrictEqual({ ...initialExpectedValue, diff: diff - interval });
        });
    });

    describe('expired', () => {
        it('should be false when date is in the future', () => {
            const expiry = new Date(Date.now() + 1000);
            const { result } = renderHook(() => useDateCountdown(expiry));

            const value = result.current;

            expect(value.expired).toBeFalsy();
        });

        it('should be false when date now', () => {
            const expiry = new Date(Date.now());
            const { result } = renderHook(() => useDateCountdown(expiry));

            const value = result.current;

            expect(value.expired).toBeFalsy();
        });

        it('should be true when date is in the past', () => {
            const expiry = new Date(Date.now() - 1000);
            const { result } = renderHook(() => useDateCountdown(expiry));

            const value = result.current;

            expect(value.expired).toBeTruthy();
        });

        it('should return negative diff', () => {
            const expiry = new Date(Date.now());
            const { result } = renderHook(() => useDateCountdown(expiry));

            const advanceBy = 1 * DAY + 2 * HOUR + 3 * MINUTE + 4 * SECOND;
            act(() => {
                jest.advanceTimersByTime(advanceBy);
            });

            expect(result.current).toStrictEqual({
                diff: -advanceBy,
                expired: true,
                days: 1,
                hours: 2,
                minutes: 3,
                seconds: 4,
            });
        });
    });

    it('should correctly countdown', () => {
        let diff = 2 * DAY + 12 * HOUR + 3 * MINUTE + 32 * SECOND;
        const expiry = new Date(Date.now() + diff);
        const { result } = renderHook(() => useDateCountdown(expiry));

        expect(result.current).toStrictEqual({
            diff,
            expired: false,
            days: 2,
            hours: 12,
            minutes: 3,
            seconds: 32,
        });

        // fast-forward time 1 Day
        act(() => {
            jest.advanceTimersByTime(DAY);
        });
        diff -= DAY;
        expect(result.current).toStrictEqual({
            diff,
            expired: false,
            days: 1,
            hours: 12,
            minutes: 3,
            seconds: 32,
        });

        // fast-forward time 1 Hour
        act(() => {
            jest.advanceTimersByTime(HOUR);
        });
        diff -= HOUR;
        expect(result.current).toStrictEqual({
            diff,
            expired: false,
            days: 1,
            hours: 11,
            minutes: 3,
            seconds: 32,
        });

        // fast-forward time 1 Minute
        act(() => {
            jest.advanceTimersByTime(MINUTE);
        });
        diff -= MINUTE;
        expect(result.current).toStrictEqual({
            diff,
            expired: false,
            days: 1,
            hours: 11,
            minutes: 2,
            seconds: 32,
        });

        // fast-forward time 1 Second
        act(() => {
            jest.advanceTimersByTime(SECOND);
        });
        diff -= SECOND;
        expect(result.current).toStrictEqual({
            diff,
            expired: false,
            days: 1,
            hours: 11,
            minutes: 2,
            seconds: 31,
        });

        // fast-forward rest
        act(() => {
            jest.advanceTimersByTime(1 * DAY + 11 * HOUR + 2 * MINUTE + 31 * SECOND);
        });
        expect(result.current).toStrictEqual({
            diff: 0,
            expired: false,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
        });

        // fast-forward to past expiry
        act(() => {
            jest.advanceTimersByTime(1 * DAY + 2 * HOUR + 3 * MINUTE + 4 * SECOND);
        });
        expect(result.current).toStrictEqual({
            diff: -93784000,
            expired: true,
            days: 1,
            hours: 2,
            minutes: 3,
            seconds: 4,
        });
    });
});
