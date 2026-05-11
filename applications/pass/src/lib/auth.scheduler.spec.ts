import { SESSION_RESUME_MAX_RETRIES, getAutoResumeDelay } from '@proton/pass/lib/auth/scheduler';
import * as epoch from '@proton/pass/utils/time/epoch';

import { createAuthScheduler } from './auth.scheduler';

describe('createAuthScheduler', () => {
    const getEpoch = jest.spyOn(epoch, 'getEpoch');

    beforeEach(() => {
        getEpoch.mockReturnValue(0);
    });

    afterAll(() => getEpoch.mockRestore());

    test('initial state is not throttled', () => {
        const scheduler = createAuthScheduler();
        expect(scheduler.isThrottled()).toBe(false);
    });

    test('reset on fresh scheduler is a noop', () => {
        const scheduler = createAuthScheduler();
        scheduler.reset();
        expect(scheduler.isThrottled()).toBe(false);
    });

    test('attempt records timestamp and throttles within fib window', () => {
        const scheduler = createAuthScheduler();
        getEpoch.mockReturnValue(1_000);
        scheduler.attempt();

        const window = getAutoResumeDelay(1);
        getEpoch.mockReturnValue(1_000 + window - 1);
        expect(scheduler.isThrottled()).toBe(true);

        getEpoch.mockReturnValue(1_000 + window);
        expect(scheduler.isThrottled()).toBe(false);
    });

    test('successive attempts advance the fib chain', () => {
        const scheduler = createAuthScheduler();

        getEpoch.mockReturnValue(0);
        scheduler.attempt();
        const firstWindow = getAutoResumeDelay(1);

        getEpoch.mockReturnValue(firstWindow);
        scheduler.attempt();
        const secondWindow = getAutoResumeDelay(2);

        /** After second attempt: lastAttemptAt=firstWindow, retryCount=2.
         * Throttled until firstWindow + secondWindow elapsed. */
        getEpoch.mockReturnValue(firstWindow + secondWindow - 1);
        expect(scheduler.isThrottled()).toBe(true);

        getEpoch.mockReturnValue(firstWindow + secondWindow);
        expect(scheduler.isThrottled()).toBe(false);
    });

    test('attempt clamps retryCount at `SESSION_RESUME_MAX_RETRIES`', () => {
        const scheduler = createAuthScheduler();

        for (let i = 0; i < SESSION_RESUME_MAX_RETRIES + 5; i++) {
            getEpoch.mockReturnValue(i * 10_000);
            scheduler.attempt();
        }

        /** Window should plateau at getAutoResumeDelay(MAX) — not keep growing. */
        const maxWindow = getAutoResumeDelay(SESSION_RESUME_MAX_RETRIES);
        const lastAttemptAt = (SESSION_RESUME_MAX_RETRIES + 4) * 10_000;

        getEpoch.mockReturnValue(lastAttemptAt + maxWindow - 1);
        expect(scheduler.isThrottled()).toBe(true);

        getEpoch.mockReturnValue(lastAttemptAt + maxWindow);
        expect(scheduler.isThrottled()).toBe(false);
    });

    test('reset clears retry count and timestamp', () => {
        const scheduler = createAuthScheduler();

        getEpoch.mockReturnValue(1_000);
        scheduler.attempt();
        scheduler.attempt();
        expect(scheduler.isThrottled()).toBe(true);

        scheduler.reset();
        expect(scheduler.isThrottled()).toBe(false);

        /** After reset, the next attempt restarts from retryCount=1's window. */
        getEpoch.mockReturnValue(2_000);
        scheduler.attempt();

        getEpoch.mockReturnValue(2_000 + getAutoResumeDelay(1) - 1);
        expect(scheduler.isThrottled()).toBe(true);
    });
});
