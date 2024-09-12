import { getTokenFromSearchParams, tokenIsValid } from './token';

describe('URL Token Functions', () => {
    describe('tokenIsValid', () => {
        it('should return true for a valid token', () => {
            expect(tokenIsValid('abcd123456')).toBe(true);
        });

        it('should return false for a token with invalid length', () => {
            expect(tokenIsValid('abc123')).toBe(false);
            expect(tokenIsValid('abcdefghijk')).toBe(false);
        });

        it('should return false for a token with invalid characters', () => {
            expect(tokenIsValid('abcd@#$%^&')).toBe(false);
        });
    });

    describe('getTokenFromSearchParams', () => {
        const originalWindowLocation = window.location;

        beforeEach(() => {
            Object.defineProperty(window, 'location', {
                writable: true,
                value: { ...originalWindowLocation, search: '' },
            });
        });

        afterEach(() => {
            Object.defineProperty(window, 'location', {
                writable: true,
                value: originalWindowLocation,
            });
        });

        it('should return valid token from search params', () => {
            const searchParams = new URLSearchParams();
            searchParams.append('token', 'abcd123456');
            window.location.search = searchParams.toString();

            expect(getTokenFromSearchParams()).toBe('abcd123456');
        });

        it('should return undefined for invalid token', () => {
            const searchParams = new URLSearchParams();
            searchParams.append('token', 'https://token');
            window.location.search = searchParams.toString();

            expect(getTokenFromSearchParams()).toBeUndefined();
        });

        it('should return undefined when token is missing', () => {
            const searchParams = new URLSearchParams();
            searchParams.append('other', 'param');
            window.location.search = searchParams.toString();

            expect(getTokenFromSearchParams()).toBeUndefined();
        });
    });
});
