import { createEventLimiter } from './limiter';

describe('createEventLimiter', () => {
    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    test('should allow messages within limit', () => {
        const limiter = createEventLimiter({ windowMax: 3, windowMs: 1000 });
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(true);
    });

    test('should block messages exceeding limit', () => {
        const limiter = createEventLimiter({ windowMax: 2, windowMs: 1000 });
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(false);
        expect(limiter.allowMessage()).toBe(false);
    });

    test('should reset window after timeout', () => {
        const limiter = createEventLimiter({ windowMax: 1, windowMs: 1000 });
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(false);

        jest.advanceTimersByTime(1000);
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(false);
    });

    test('should allow manually resetting limiter', () => {
        const limiter = createEventLimiter({ windowMax: 1, windowMs: 1000 });
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(false);

        limiter.reset();
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(false);
    });

    test('should block all messages if 0 limit', () => {
        const limiter = createEventLimiter({ windowMax: 0, windowMs: 1000 });
        expect(limiter.allowMessage()).toBe(false);
        expect(limiter.allowMessage()).toBe(false);

        jest.advanceTimersByTime(1000);
        expect(limiter.allowMessage()).toBe(false);
    });

    test('should handle multiple keys independently', () => {
        const limiter = createEventLimiter({ windowMax: 2, windowMs: 1000 });

        expect(limiter.allowMessage('key1')).toBe(true);
        expect(limiter.allowMessage('key1')).toBe(true);
        expect(limiter.allowMessage('key1')).toBe(false);

        expect(limiter.allowMessage('key2')).toBe(true);
        expect(limiter.allowMessage('key2')).toBe(true);

        expect(limiter.allowMessage('key2')).toBe(false);
        expect(limiter.allowMessage('key1')).toBe(false);
    });

    test('should reset specific keys independently', () => {
        const limiter = createEventLimiter({ windowMax: 1, windowMs: 1000 });

        expect(limiter.allowMessage('key1')).toBe(true);
        expect(limiter.allowMessage('key1')).toBe(false);
        expect(limiter.allowMessage('key2')).toBe(true);
        expect(limiter.allowMessage('key2')).toBe(false);

        limiter.reset('key1');
        expect(limiter.allowMessage('key1')).toBe(true);
        expect(limiter.allowMessage('key2')).toBe(false);

        limiter.reset('key2');
        expect(limiter.allowMessage('key2')).toBe(true);
    });

    test('should apply per-call override options over base window config', () => {
        const limiter = createEventLimiter({ windowMax: 1, windowMs: 1000 });

        /** override allows 3 messages per 500ms for this specific key */
        expect(limiter.allowMessage('key1', { windowMax: 3, windowMs: 500 })).toBe(true);
        expect(limiter.allowMessage('key1', { windowMax: 3, windowMs: 500 })).toBe(true);
        expect(limiter.allowMessage('key1', { windowMax: 3, windowMs: 500 })).toBe(true);
        expect(limiter.allowMessage('key1', { windowMax: 3, windowMs: 500 })).toBe(false);

        /** base config still applies for other keys */
        expect(limiter.allowMessage('key2')).toBe(true);
        expect(limiter.allowMessage('key2')).toBe(false);

        /** override window resets after overridden windowMs, not base windowMs */
        jest.advanceTimersByTime(500);
        expect(limiter.allowMessage('key1', { windowMax: 3, windowMs: 500 })).toBe(true);
        expect(limiter.allowMessage('key2')).toBe(false);
    });
});
