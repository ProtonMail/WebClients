import browser, { clearBrowserMocks } from 'proton-pass-extension/__mocks__/webextension-polyfill';
import { WorkerContext } from 'proton-pass-extension/app/worker/context/inject';

import {
    SESSION_RESUME_MAX_RETRIES,
    SESSION_RESUME_TIMEOUT_MIN,
    getAutoResumeDelay,
} from '@proton/pass/lib/auth/scheduler';
import { epochToMs } from '@proton/pass/utils/time/epoch';
import { FIBONACCI_LIST } from '@proton/shared/lib/constants';

import { type AuthAlarms, SESSION_LOCK_ALARM, SESSION_RESUME_ALARM, createAuthAlarms } from './auth.alarms';

const NOW_S = 1_700_000_000;
const NOW_MS = NOW_S * 1_000;

const setPendingAlarm = (pending: boolean) => {
    const result = pending ? { scheduledTime: NOW_MS + 60_000 } : undefined;
    browser.alarms.get.mockResolvedValue(result);
};

const expectScheduledAt = (callIndex: number, retryIdx: number) => {
    const calls = (browser.alarms.create as jest.Mock).mock.calls;
    expect(calls[callIndex]).toEqual([SESSION_RESUME_ALARM, { when: (NOW_S + getAutoResumeDelay(retryIdx)) * 1_000 }]);
};

describe('AuthAlarms', () => {
    let alarms: AuthAlarms;
    let store: Record<string, any>;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(NOW_MS);
        clearBrowserMocks();

        setPendingAlarm(false);
        alarms = createAuthAlarms();
        store = {};

        const sessionStorage = {
            getItems: jest.fn(async (keys: string[]) => Object.fromEntries(keys.map((k) => [k, store[k]]))),
            setItems: jest.fn(async (items) => Object.assign(store, items)),
        };

        WorkerContext.set({ service: { storage: { session: sessionStorage } } } as any);
    });

    afterEach(() => {
        jest.useRealTimers();
        WorkerContext.clear();
    });

    describe('`getAutoResumeDelay`', () => {
        test('should scale delay with the Fibonacci list', () => {
            FIBONACCI_LIST.forEach((fib, idx) => {
                expect(getAutoResumeDelay(idx)).toBe(SESSION_RESUME_TIMEOUT_MIN * fib);
            });
        });

        test('should clamp at the last Fibonacci index for retry counts past the list', () => {
            const last = FIBONACCI_LIST[FIBONACCI_LIST.length - 1];
            expect(getAutoResumeDelay(FIBONACCI_LIST.length)).toBe(SESSION_RESUME_TIMEOUT_MIN * last);
            expect(getAutoResumeDelay(FIBONACCI_LIST.length + 100)).toBe(SESSION_RESUME_TIMEOUT_MIN * last);
        });
    });

    describe('`scheduleAutoResume`', () => {
        test('should schedule with the initial Fibonacci delay on first call', async () => {
            await alarms.scheduleAutoResume({ extend: false });
            expect(browser.alarms.create).toHaveBeenCalledTimes(1);
            expectScheduledAt(0, 0);
        });

        test('should grow the delay on each subsequent retry', async () => {
            for (let i = 0; i < 4; i++) await alarms.scheduleAutoResume({ extend: false });

            expect(browser.alarms.create).toHaveBeenCalledTimes(4);
            for (let i = 0; i < 4; i++) expectScheduledAt(i, i);
        });

        test('should not schedule when an alarm is already pending', async () => {
            setPendingAlarm(true);
            await alarms.scheduleAutoResume({ extend: false });
            expect(browser.alarms.create).not.toHaveBeenCalled();
        });

        test('should not increment retry count while pending guard is active', async () => {
            /** Baseline: one successful schedule bumps the count to 1. */
            await alarms.scheduleAutoResume({ extend: false });

            setPendingAlarm(true);
            await alarms.scheduleAutoResume({ extend: false });
            await alarms.scheduleAutoResume({ extend: false });
            await alarms.scheduleAutoResume({ extend: false });

            /** Next schedule must use delay(1) — not delay(2+). */
            setPendingAlarm(false);
            await alarms.scheduleAutoResume({ extend: false });

            expect(browser.alarms.create).toHaveBeenCalledTimes(2);
            expectScheduledAt(1, 1);
        });

        test('should stop scheduling after reaching `SESSION_RESUME_MAX_RETRIES`', async () => {
            for (let i = 0; i < SESSION_RESUME_MAX_RETRIES + 5; i++) await alarms.scheduleAutoResume({ extend: false });
            expect(browser.alarms.create).toHaveBeenCalledTimes(SESSION_RESUME_MAX_RETRIES);
        });

        test('should refresh `lastSetAt` even when throttled by max retries', async () => {
            for (let i = 0; i < SESSION_RESUME_MAX_RETRIES + 2; i++) await alarms.scheduleAutoResume({ extend: false });

            /** Past the max throttle window: gate would be false unless the next call refreshes `lastSetAt`. */
            jest.setSystemTime(epochToMs(NOW_S + getAutoResumeDelay(SESSION_RESUME_MAX_RETRIES) + 10));
            expect(await alarms.isResumeThrottled()).toBe(false);

            await alarms.scheduleAutoResume({ extend: false });
            expect(await alarms.isResumeThrottled()).toBe(true);
        });

        describe('`extend` flag', () => {
            test('should not consume the retry budget when called with `extend: true`', async () => {
                /** Many extend-only calls should never advance the cap. */
                for (let i = 0; i < 50; i++) {
                    setPendingAlarm(false);
                    await alarms.scheduleAutoResume({ extend: true });
                }

                /** Now drive real attempts: the full MAX budget must still be available. */
                (browser.alarms.create as jest.Mock).mockClear();
                for (let i = 0; i < SESSION_RESUME_MAX_RETRIES + 3; i++) {
                    setPendingAlarm(false);
                    await alarms.scheduleAutoResume({ extend: false });
                }
                expect(browser.alarms.create).toHaveBeenCalledTimes(SESSION_RESUME_MAX_RETRIES);
            });

            test('should keep delay at the current Fibonacci slot during defers', async () => {
                /** Real attempt 1: delay(0) = 15s, count → 1. */
                await alarms.scheduleAutoResume({ extend: false });

                /** Defers: delay should stay at delay(1) for all of them — the
                 * progression earned by the first real attempt is preserved,
                 * but defers don't push it further. */
                for (let i = 0; i < 5; i++) {
                    setPendingAlarm(false);
                    await alarms.scheduleAutoResume({ extend: true });
                }

                const calls = (browser.alarms.create as jest.Mock).mock.calls;
                expect(calls).toHaveLength(6);
                /** First schedule at delay(0), the rest at delay(1). */
                expectScheduledAt(0, 0);
                for (let i = 1; i < 6; i++) expectScheduledAt(i, 1);
            });

            test('should let real attempts continue advancing the count after defers', async () => {
                /** Defer-then-attempt: each real attempt advances; defers don't. */
                await alarms.scheduleAutoResume({ extend: true });
                setPendingAlarm(false);
                await alarms.scheduleAutoResume({ extend: false });
                setPendingAlarm(false);
                await alarms.scheduleAutoResume({ extend: true });
                setPendingAlarm(false);
                await alarms.scheduleAutoResume({ extend: false });

                /** Real attempts at indices 1 and 3 advance the count: 0 → 1 after
                 * call 2, 1 → 2 after call 4. Calls 0 and 2 are defers. */
                expectScheduledAt(0, 0);
                expectScheduledAt(1, 0);
                expectScheduledAt(2, 1);
                expectScheduledAt(3, 1);
            });

            test('should still update `lastSetAt` for `extend: true` calls', async () => {
                await alarms.scheduleAutoResume({ extend: true });
                expect(await alarms.isResumeThrottled()).toBe(true);
            });
        });
    });

    describe('`registerResumeFailure`', () => {
        test('should bump resumeCount so the next schedule uses delay(1)', async () => {
            await alarms.registerResumeFailure();
            await alarms.scheduleAutoResume({ extend: false });
            expectScheduledAt(0, 1);
        });

        test('should stamp resumeAttemptedAt so isResumeThrottled is true with no alarm pending', async () => {
            await alarms.registerResumeFailure();
            expect(await alarms.isResumeThrottled()).toBe(true);
        });

        test('should cap resumeCount at `SESSION_RESUME_MAX_RETRIES`', async () => {
            for (let i = 0; i < SESSION_RESUME_MAX_RETRIES + 5; i++) await alarms.registerResumeFailure();
            await alarms.scheduleAutoResume({ extend: false });
            expect(browser.alarms.create).not.toHaveBeenCalled();
        });
    });

    describe('`hydrate`', () => {
        test('should read persisted state from `storage.session` on first call', async () => {
            store = { resumeCount: 3, resumeAttemptedAt: NOW_S };
            await alarms.hydrate();
            await alarms.scheduleAutoResume({ extend: false });
            expectScheduledAt(0, 3);
        });

        test('should hydrate only once', async () => {
            const { getItems } = WorkerContext.get().service.storage.session as any;
            await alarms.hydrate();
            await alarms.hydrate();
            expect(getItems).toHaveBeenCalledTimes(1);
        });
    });

    describe('`isResumeThrottled`', () => {
        test('should return false initially', async () => {
            expect(await alarms.isResumeThrottled()).toBe(false);
        });

        test('should hydrate persisted state on the read path', async () => {
            store = { resumeCount: 2, resumeAttemptedAt: NOW_S };
            alarms = createAuthAlarms();
            expect(await alarms.isResumeThrottled()).toBe(true);
        });

        test('should return true when an alarm is pending', async () => {
            setPendingAlarm(true);
            expect(await alarms.isResumeThrottled()).toBe(true);
        });

        test('should return true within the current backoff slot after `scheduleAutoResume`', async () => {
            /** One `extend: false` advances count to 1 → window is getAutoResumeDelay(1). */
            await alarms.scheduleAutoResume({ extend: false });
            jest.setSystemTime(epochToMs(NOW_S + getAutoResumeDelay(1) - 1));
            expect(await alarms.isResumeThrottled()).toBe(true);
        });

        test('should return false past the current backoff slot when no alarm pending', async () => {
            await alarms.scheduleAutoResume({ extend: false });
            jest.setSystemTime(epochToMs(NOW_S + getAutoResumeDelay(1) + 1));
            expect(await alarms.isResumeThrottled()).toBe(false);
        });

        test('should converge to the max backoff slot at chain exhaustion', async () => {
            for (let i = 0; i < SESSION_RESUME_MAX_RETRIES; i++) await alarms.scheduleAutoResume({ extend: false });
            /** At MAX retries the slot delay clamps to its terminal value. */
            const maxWindow = getAutoResumeDelay(SESSION_RESUME_MAX_RETRIES);
            jest.setSystemTime(epochToMs(NOW_S + maxWindow - 1));
            expect(await alarms.isResumeThrottled()).toBe(true);
            jest.setSystemTime(epochToMs(NOW_S + maxWindow + 1));
            expect(await alarms.isResumeThrottled()).toBe(false);
        });
    });

    describe('`resetAutoResume`', () => {
        test('should reset retry count so next schedule uses delay(0)', async () => {
            for (let i = 0; i < 3; i++) await alarms.scheduleAutoResume({ extend: false });

            browser.alarms.create.mockClear();
            await alarms.resetAutoResume();
            await alarms.scheduleAutoResume({ extend: false });

            expectScheduledAt(0, 0);
        });

        test('should clear `lastSetAt` so throttle window collapses', async () => {
            await alarms.scheduleAutoResume({ extend: false });
            await alarms.resetAutoResume();
            expect(await alarms.isResumeThrottled()).toBe(false);
        });
    });

    describe('`clearAutoResume` / `clearAutoLock`', () => {
        test('should clear the auto-resume alarm', async () => {
            await alarms.clearAutoResume();
            expect(browser.alarms.clear).toHaveBeenCalledWith(SESSION_RESUME_ALARM);
        });

        test('should clear the auto-lock alarm', async () => {
            await alarms.clearAutoLock();
            expect(browser.alarms.clear).toHaveBeenCalledWith(SESSION_LOCK_ALARM);
        });
    });

    describe('`setAutoLock`', () => {
        test('should reset and recreate the auto-lock alarm with the computed `when`', async () => {
            const ttl = 600;
            await alarms.setAutoLock(ttl);
            expect(browser.alarms.clear).toHaveBeenCalledWith(SESSION_LOCK_ALARM);
            expect(browser.alarms.create).toHaveBeenCalledWith(SESSION_LOCK_ALARM, { when: epochToMs(NOW_S + ttl) });
        });
    });
});
