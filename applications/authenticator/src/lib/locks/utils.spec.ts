import { obfuscate, obfuscateLegacy } from '@proton/pass/utils/obfuscate/xor';
import { serialize } from '@proton/pass/utils/object/serialize';

import { LOCK_MAX_FAILURES, LOCK_STATE_KEY, getFailedAttemptCount } from './utils';

describe('lock utils', () => {
    beforeEach(() => localStorage.clear());

    describe('getFailedAttemptCount', () => {
        test('returns null when nothing is stored', () => {
            expect(getFailedAttemptCount()).toBeNull();
        });

        test('[legacy V1] reads count stored with JSON.stringify + obfuscateLegacy', () => {
            localStorage.setItem(LOCK_STATE_KEY, JSON.stringify(obfuscateLegacy('3')));
            expect(getFailedAttemptCount()).toBe(3);
        });

        test('[legacy V1] reads LOCK_MAX_FAILURES stored with legacy scheme', () => {
            localStorage.setItem(LOCK_STATE_KEY, JSON.stringify(obfuscateLegacy(String(LOCK_MAX_FAILURES))));
            expect(getFailedAttemptCount()).toBe(LOCK_MAX_FAILURES);
        });

        test('[legacy V1] reads 0 stored with legacy scheme', () => {
            localStorage.setItem(LOCK_STATE_KEY, JSON.stringify(obfuscateLegacy('0')));
            expect(getFailedAttemptCount()).toBe(0);
        });

        test('[new V2] reads count stored with serialize + obfuscate', () => {
            localStorage.setItem(LOCK_STATE_KEY, serialize(obfuscate('7')));
            expect(getFailedAttemptCount()).toBe(7);
        });

        test('[new V2] reads LOCK_MAX_FAILURES stored with new scheme', () => {
            localStorage.setItem(LOCK_STATE_KEY, serialize(obfuscate(String(LOCK_MAX_FAILURES))));
            expect(getFailedAttemptCount()).toBe(LOCK_MAX_FAILURES);
        });
    });
});
