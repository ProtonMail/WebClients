import { ChargebeeInstanceConfiguration } from '../lib';
import { createChargebee, getChargebeeInstance, isChargebeeLoaded, pollUntilLoaded, resetChargebee } from './chargebee';

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
    });

    afterEach(() => {
        jest.useRealTimers();
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

    it('should throw an error when Chargebee did not load', async () => {
        delete (global as any).Chargebee;
        const promise = pollUntilLoaded();

        let reason: any;
        promise.catch((error) => {
            reason = error;
        });

        await jest.runAllTimersAsync();

        expect(reason).toEqual(new Error('Chargebee did not load'));
    });
});
