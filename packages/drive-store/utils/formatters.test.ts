import { COUNT_PLACEHOLDER, formatAccessCount } from './formatters';

describe('Formatters', () => {
    describe('formatAccessCount()', () => {
        it('should return `...` if input value it undefined', () => {
            expect(formatAccessCount(undefined)).toBe(COUNT_PLACEHOLDER);
        });
        it('should return the input unchanged if the input is a number', () => {
            const input = 42;
            expect(formatAccessCount(input)).toBe(42);
            expect(formatAccessCount(input)).not.toBe(56);
        });
    });
});
