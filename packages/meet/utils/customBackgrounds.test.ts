import { describe, expect, it } from 'vitest';

import {
    getBackgroundNamespace,
    getCustomBackgroundRecordId,
    isCustomBackgroundEffect,
    isGuestBackgroundNamespace,
    toCustomBackgroundEffect,
} from './customBackgrounds';
import { isVirtualBackgroundId } from './virtualBackgrounds';

describe('custom background effect ids', () => {
    it('round-trips a record id', () => {
        const effect = toCustomBackgroundEffect('node-uid~1');

        expect(isCustomBackgroundEffect(effect)).toBe(true);
        expect(getCustomBackgroundRecordId(effect)).toBe('node-uid~1');
    });

    it('does not collide with the preset ids sharing the union', () => {
        expect(isCustomBackgroundEffect('beach')).toBe(false);
        expect(isVirtualBackgroundId(toCustomBackgroundEffect('beach'))).toBe(false);
    });

    it('rejects a prefix with no record id behind it', () => {
        expect(isCustomBackgroundEffect('custom:')).toBe(false);
        expect(getCustomBackgroundRecordId('custom:')).toBeNull();
    });
});

describe('getBackgroundNamespace', () => {
    it('scopes signed-in users by user id', () => {
        expect(getBackgroundNamespace({ isGuest: false, userId: 'abc' })).toBe('user.abc');
    });

    it('scopes guests by their own identifier, ignoring any user id', () => {
        expect(getBackgroundNamespace({ isGuest: true, userId: 'abc', guestId: 'guest-1' })).toBe('guest.guest-1');
        expect(getBackgroundNamespace({ isGuest: false, guestId: 'guest-1' })).toBe('guest.guest-1');
    });

    it('has no namespace without an identifier to scope on, rather than one that would be shared', () => {
        expect(getBackgroundNamespace({ isGuest: true })).toBeUndefined();
        expect(getBackgroundNamespace({ isGuest: false })).toBeUndefined();
    });
});

describe('isGuestBackgroundNamespace', () => {
    it('keeps guest and user namespaces apart', () => {
        expect(isGuestBackgroundNamespace('guest.guest-1')).toBe(true);
        expect(isGuestBackgroundNamespace('user.abc')).toBe(false);
    });
});
