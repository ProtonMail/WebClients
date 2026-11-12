import { setLocation } from '@proton/jest-env/setLocation';

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
        it('should return valid token from search params', () => {
            const searchParams = new URLSearchParams();
            searchParams.append('token', 'abcd123456');
            setLocation(`?${searchParams.toString()}`);

            expect(getTokenFromSearchParams()).toBe('abcd123456');
        });

        it('should return undefined for invalid token', () => {
            const searchParams = new URLSearchParams();
            searchParams.append('token', 'https://token');
            setLocation(`?${searchParams.toString()}`);

            expect(getTokenFromSearchParams()).toBeUndefined();
        });

        it('should return undefined when token is missing', () => {
            const searchParams = new URLSearchParams();
            searchParams.append('other', 'param');
            setLocation(`?${searchParams.toString()}`);

            expect(getTokenFromSearchParams()).toBeUndefined();
        });
    });
});
