import {
    SESSION_DIGEST_VERSION,
    SESSION_INTEGRITY_KEYS_V1,
    digestSession,
    getSessionDigestVersion,
    getSessionIntegrityKeys,
} from './integrity';
import { LockMode } from './lock/types';

const MOCK_SESSION = {
    AccessToken: '',
    LocalID: 12,
    lockMode: LockMode.PASSWORD,
    lockTTL: 3600,
    offlineVerifier: 'abc',
    payloadVersion: 1,
    persistent: true,
    RefreshTime: -1,
    RefreshToken: '',
    UID: 'uid-001',
    UserID: 'uid-002',
    isSSOUser: false,
} as const;

describe('Session integrity', () => {
    describe('`getSessionIntegrityKeys`', () => {
        it('should return correct keys for version 1', () => {
            expect(getSessionIntegrityKeys(1)).toEqual(SESSION_INTEGRITY_KEYS_V1);
        });

        it('should return an empty array for unknown versions', () => {
            expect(getSessionIntegrityKeys(-1)).toEqual([]);
            expect(getSessionIntegrityKeys(999)).toEqual([]);
        });
    });

    describe('`getSessionDigestVersion`', () => {
        it('should extract the correct version from a valid digest', () => {
            expect(getSessionDigestVersion('2.7f83b1657ff1fc53b92dc')).toBe(2);
            expect(getSessionDigestVersion('24.18148a1d65dfc2d4b1k9d')).toBe(24);
            expect(getSessionDigestVersion('004.a3d677284addd200126d9')).toBe(4);
        });

        it('should return `SESSION_DIGEST_VERSION` for invalid digests', () => {
            expect(getSessionDigestVersion('7f83b1657ff1fc53b92dc')).toBe(SESSION_DIGEST_VERSION);
            expect(getSessionDigestVersion('notanumber.18148a1d65dfc2d4b1k9d')).toBe(SESSION_DIGEST_VERSION);
        });
    });

    describe('`digestSession`', () => {
        it('should generate a correct digest', async () => {
            const digest = '1.rpaFGlfkJtY27MfCzrnooGceeEfun+khBXvWr4U0hWM=';
            const result = await digestSession(MOCK_SESSION, 1);
            expect(result).toEqual(digest);
        });

        it('should generate different digests for different sessions', async () => {
            const sessionA = MOCK_SESSION;
            const digestA = await digestSession(sessionA, 1);

            const sessionB = { ...MOCK_SESSION, LocalID: 42 };
            const digestB = await digestSession(sessionB, 1);

            expect(digestA).not.toBe(digestB);
        });
    });
});
