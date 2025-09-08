import { isUrlPasswordValid } from './isUrlPasswordValid';

describe('isUrlPasswordValid', () => {
    it('should return true for valid 12-character alphanumeric password', () => {
        expect(isUrlPasswordValid('#pwd-ABC123xyz789')).toBe(true);
    });

    it('should return false when password length is not 12 characters', () => {
        expect(isUrlPasswordValid('#pwd-ABC123xyz78')).toBe(false); // 11 chars
        expect(isUrlPasswordValid('@pwd-ABC123xyz7890')).toBe(false); // 13 chars
        expect(isUrlPasswordValid('#pwd-')).toBe(false); // empty
    });

    it('should return false when password contains invalid characters', () => {
        expect(isUrlPasswordValid('#pwd-ABC123xyz78!')).toBe(false); // special char
        expect(isUrlPasswordValid('#pwd-ABC123xyz 78')).toBe(false); // space
        expect(isUrlPasswordValid('#pwd-ABC123-xyz78')).toBe(false); // hyphen
    });

    it('should return false for non-string input', () => {
        // @ts-expect-error - we want to test the function with invalid input
        expect(isUrlPasswordValid(null)).toBe(false);
        // @ts-expect-error - we want to test the function with invalid input
        expect(isUrlPasswordValid(undefined)).toBe(false);
        // @ts-expect-error - we want to test the function with invalid input
        expect(isUrlPasswordValid(123456789012)).toBe(false);
    });

    it('should return false when hash does not start with #pwd-', () => {
        expect(isUrlPasswordValid('ABC123xyz789')).toBe(false);
    });
});
