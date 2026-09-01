import { beforeEach, describe, expect, it } from 'vitest';

import { getOrCreateGuestBackgroundId, getPersistedGuestBackgroundId } from './guestBackgroundIdentity';

describe('guest background identity', () => {
    beforeEach(() => {
        sessionStorage.clear();
    });

    it('has no identifier until one is asked for', () => {
        expect(getPersistedGuestBackgroundId()).toBeUndefined();
    });

    it('keeps the same identifier for the lifetime of the tab', () => {
        const id = getOrCreateGuestBackgroundId();

        expect(id).toBeTruthy();
        expect(getOrCreateGuestBackgroundId()).toBe(id);
        expect(getPersistedGuestBackgroundId()).toBe(id);
    });

    it('leaves no identifier behind for the next session to be mistaken for', () => {
        getOrCreateGuestBackgroundId();
        sessionStorage.clear();

        expect(getPersistedGuestBackgroundId()).toBeUndefined();
    });
});
