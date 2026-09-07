import type { ChargebeeInstanceConfiguration } from '../lib/types';
import {
    CHARGEBEE_LOAD_TIMEOUT,
    createChargebee,
    getChargebeeInstance,
    isChargebeeLoaded,
    pollUntilLoaded,
    resetChargebee,
} from './chargebee';
import { getCheckpoints, resetCheckpoints } from './checkpoints';

beforeEach(() => {
    (global as any).Chargebee = {
        init: jest.fn().mockReturnValue({
            chargebeeMock: true,
        }),
    };

    resetChargebee();
});

it('should create instance', () => {
    const config: ChargebeeInstanceConfiguration = {
        publishableKey: 'pk_test_123',
        site: 'test-site',
        domain: 'proton.me',
    };
    const result = createChargebee(config);
    expect(result).toEqual({ chargebeeMock: true });
    expect((global as any).Chargebee.init).toHaveBeenCalledWith(config);
});

it('should save instance', () => {
    const config: ChargebeeInstanceConfiguration = {
        publishableKey: 'pk_test_123',
        site: 'test-site',
        domain: 'proton.me',
    };
    const result = createChargebee(config);

    expect(getChargebeeInstance()).toEqual(result);
    expect(getChargebeeInstance()).toEqual({
        chargebeeMock: true,
    });
});

it('should throw error if not initialized', () => {
    expect(() => getChargebeeInstance()).toThrow();
});

describe('isChargebeeLoaded', () => {
    it('should return true when Chargebee is loaded', () => {
        (global as any).Chargebee = {};
        expect(isChargebeeLoaded()).toBe(true);
    });

    it('should return false when Chargebee is not loaded', () => {
        (global as any).Chargebee = undefined;
        expect(isChargebeeLoaded()).toBe(false);
    });
});

describe('pollUntilLoaded', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        window.__chargebeeScriptErrors = [];
        window.__chargebeeScriptFailed = false;

        // The diagnostics read the src off the tag, so the tag index.html ships has to be present.
        const scriptTag = document.createElement('script');
        scriptTag.id = 'chargebee-js';
        scriptTag.src = 'https://js.chargebee.com/v2/chargebee.js';
        document.head.appendChild(scriptTag);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        delete (performance as any).getEntriesByType;
        document.head.querySelectorAll('script').forEach((script) => script.remove());
    });

    it('should resolve when Chargebee is loaded', async () => {
        (global as any).Chargebee = {};

        const promise = pollUntilLoaded();
        await jest.runAllTimersAsync();

        await expect(promise).resolves.toBeUndefined();
    });

    it('should wait and resolve when Chargebee is loaded after some time', async () => {
        delete (global as any).Chargebee;
        let resolved = false; // Flag to track promise resolution
        const promise = pollUntilLoaded().then(() => {
            resolved = true;
        }); // Set flag when resolved

        await jest.advanceTimersByTimeAsync(20000);

        // Check that the promise has not resolved yet
        expect(resolved).toBe(false); // This line checks that the promise is still pending

        (global as any).Chargebee = {};
        await jest.advanceTimersByTimeAsync(1000);

        await expect(promise).resolves.toBeUndefined();
    });

    const pollUntilRejected = async () => {
        const promise = pollUntilLoaded();

        let reason: any;
        promise.catch((error) => {
            reason = error;
        });

        await jest.runAllTimersAsync();

        return reason;
    };

    // jsdom has no resource timing, so it is provided rather than spied on.
    const withResourceTimings = (names: string[]) => {
        (performance as any).getEntriesByType = () =>
            names.map((name) => ({ name, startTime: 1, duration: 2, responseEnd: 3 }));
    };

    it('should report that the request never completed when it is missing from resource timing', async () => {
        delete (global as any).Chargebee;
        withResourceTimings(['https://account-api.proton.me/payments/v5/forms/cards']);

        expect(await pollUntilRejected()).toEqual(new Error('Chargebee script request never completed'));
    });

    it('should not guess at the reason when the script tag is gone', async () => {
        delete (global as any).Chargebee;
        document.getElementById('chargebee-js')?.remove();
        withResourceTimings(['https://js.chargebee.com/v2/chargebee.js']);

        expect(await pollUntilRejected()).toEqual(new Error('Chargebee script is missing for an undetermined reason'));
    });

    it('should not blame the network when resource timing is unavailable', async () => {
        delete (global as any).Chargebee;
        delete (performance as any).getEntriesByType;

        expect(await pollUntilRejected()).toEqual(new Error('Chargebee script is missing for an undetermined reason'));
    });

    it('should not blame the network when the resource buffer recorded nothing', async () => {
        delete (global as any).Chargebee;
        withResourceTimings([]);

        expect(await pollUntilRejected()).toEqual(new Error('Chargebee script is missing for an undetermined reason'));
    });

    it('should report a load failure when the Chargebee script tag reported an error', async () => {
        delete (global as any).Chargebee;
        window.__chargebeeScriptFailed = true;
        window.__chargebeeScriptErrors = ['https://js.chargebee.com/v2/chargebee.js'];

        expect(await pollUntilRejected()).toEqual(new Error('Chargebee script failed to load'));
    });

    it('should fail immediately when the script already errored, without spending the poll budget', async () => {
        delete (global as any).Chargebee;
        resetCheckpoints();
        window.__chargebeeScriptFailed = true;
        window.__chargebeeScriptErrors = ['https://js.chargebee.com/v2/chargebee.js'];

        // No timers are advanced: anything still waiting would hang here.
        await expect(pollUntilLoaded()).rejects.toEqual(new Error('Chargebee script failed to load'));

        const checkpoint = getCheckpoints().find(({ name }) => name === 'chargebee.load_failed');
        expect(checkpoint?.data).toMatchObject({
            failedBeforePolling: true,
            elapsedMs: 0,
            iterations: 0,
            chargebeeScriptFailed: true,
        });
    });

    it('should abandon the poll budget when the script errors mid-flight', async () => {
        delete (global as any).Chargebee;
        resetCheckpoints();
        withResourceTimings(['https://js.chargebee.com/v2/chargebee.js']);

        const promise = pollUntilLoaded();
        let reason: any;
        promise.catch((error) => {
            reason = error;
        });

        // A slow request that only fails after waiting has started.
        await jest.advanceTimersByTimeAsync(5000);
        window.__chargebeeScriptFailed = true;
        window.__chargebeeScriptErrors = ['https://js.chargebee.com/v2/chargebee.js'];
        await jest.advanceTimersByTimeAsync(1000);

        expect(reason).toEqual(new Error('Chargebee script failed to load'));

        const checkpoint = getCheckpoints().find(({ name }) => name === 'chargebee.load_failed');
        expect(checkpoint?.data).toMatchObject({
            failedBeforePolling: false,
            chargebeeScriptFailed: true,
        });
        // The remaining 34s are not spent once the script can no longer arrive.
        expect(checkpoint?.data.elapsedMs).toBeLessThan(CHARGEBEE_LOAD_TIMEOUT);
    });

    it('should still spend the poll budget when nothing reported an error', async () => {
        delete (global as any).Chargebee;
        resetCheckpoints();
        withResourceTimings(['https://js.chargebee.com/v2/chargebee.js']);

        expect(await pollUntilRejected()).toEqual(new Error('Chargebee script loaded but did not run'));

        const checkpoint = getCheckpoints().find(({ name }) => name === 'chargebee.load_failed');
        expect(checkpoint?.data).toMatchObject({ failedBeforePolling: false });
        expect(checkpoint?.data.elapsedMs).toBeGreaterThanOrEqual(CHARGEBEE_LOAD_TIMEOUT);
    });

    it('should not blame Chargebee when a different script failed', async () => {
        delete (global as any).Chargebee;
        // Other payment scripts can fail without Chargebee's own script failing.
        window.__chargebeeScriptErrors = ['https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js'];
        withResourceTimings(['https://account-api.proton.me/payments/v5/forms/cards']);

        expect(await pollUntilRejected()).toEqual(new Error('Chargebee script request never completed'));
    });

    it('should report that the script did not run when it was fetched successfully', async () => {
        delete (global as any).Chargebee;
        withResourceTimings(['https://js.chargebee.com/v2/chargebee.js']);

        expect(await pollUntilRejected()).toEqual(new Error('Chargebee script loaded but did not run'));
    });

    it('should stop polling on wall-clock time rather than on the sum of requested delays', async () => {
        delete (global as any).Chargebee;
        const promise = pollUntilLoaded();
        promise.catch(() => {});

        // Timers firing far later than asked, as they do in a hidden or offscreen frame.
        const clampedStep = 5000;
        for (let elapsed = 0; elapsed < CHARGEBEE_LOAD_TIMEOUT; elapsed += clampedStep) {
            await jest.advanceTimersByTimeAsync(clampedStep);
        }

        await expect(promise).rejects.toThrow();
    });
});
