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
        const limiter = createEventLimiter(3, 1000);
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(true);
    });

    test('should block messages exceeding limit', () => {
        const limiter = createEventLimiter(2, 1000);
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(false);
        expect(limiter.allowMessage()).toBe(false);
    });

    test('should reset window after timeout', () => {
        const limiter = createEventLimiter(1, 1000);
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(false);

        jest.advanceTimersByTime(1000);
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(false);
    });

    test('should allow manually resetting limiter', () => {
        const limiter = createEventLimiter(1, 1000);
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(false);

        limiter.reset();
        expect(limiter.allowMessage()).toBe(true);
        expect(limiter.allowMessage()).toBe(false);
    });

    test('should block all messages if 0 limit', () => {
        const limiter = createEventLimiter(0, 1000);
        expect(limiter.allowMessage()).toBe(false);
        expect(limiter.allowMessage()).toBe(false);

        jest.advanceTimersByTime(1000);
        expect(limiter.allowMessage()).toBe(false);
    });

    test('should handle multiple keys independently', () => {
        const limiter = createEventLimiter(2, 1000);

        expect(limiter.allowMessage('key1')).toBe(true);
        expect(limiter.allowMessage('key1')).toBe(true);
        expect(limiter.allowMessage('key1')).toBe(false);

        expect(limiter.allowMessage('key2')).toBe(true);
        expect(limiter.allowMessage('key2')).toBe(true);

        expect(limiter.allowMessage('key2')).toBe(false);
        expect(limiter.allowMessage('key1')).toBe(false);
    });

    test('should reset specific keys independently', () => {
        const limiter = createEventLimiter(1, 1000);

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
});
