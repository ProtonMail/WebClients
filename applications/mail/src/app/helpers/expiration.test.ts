import { UserModel } from '@proton/shared/lib/interfaces';

import { canSetExpiration } from './expiration';

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
