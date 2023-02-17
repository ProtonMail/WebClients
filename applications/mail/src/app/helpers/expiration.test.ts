import { UserModel } from '@proton/shared/lib/interfaces';

import { canSetExpiration, getExpirationTime } from './expiration';

describe('canSetExpiration', () => {
    it('should return false if feature flag is false', () => {
        expect(canSetExpiration(false, { isFree: false } as UserModel)).toBe(false);
    });

    it('should return false if user is free', () => {
        expect(canSetExpiration(true, { isFree: true } as UserModel)).toBe(false);
    });

    it('should return true if feature flag is true and user is paid', () => {
        expect(canSetExpiration(true, { isFree: false } as UserModel)).toBe(true);
    });
});

describe('getExpirationTime', () => {
    it('should return null if days is 0', () => {
        expect(getExpirationTime(0)).toBe(null);
    });

    it('should return a Unix timestamp if days is > 0', () => {
        expect(getExpirationTime(1)).toBeGreaterThan(0);
    });
});
