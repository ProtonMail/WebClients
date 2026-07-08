import { createAuthStore } from '@proton/pass/lib/auth/store';
import { generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { createMemoryStore } from '@proton/pass/utils/store';
import { generateClientKey } from '@proton/shared/lib/authentication/clientKey';
import { getDecryptedBlob, getEncryptedBlob } from '@proton/shared/lib/authentication/sessionBlobCryptoHelper';
import { uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

import { SESSION_DIGEST_VERSION, digestSession } from './integrity';
import { LockMode } from './lock/types';
import {
    type AuthSession,
    decryptLaunchPasswordSessionBlob,
    encryptPersistedSessionWithKey,
    getSessionEncryptionTag,
    requiresLaunchPasswordUnlock,
    resumeSession,
} from './session';

describe('Session utilities', () => {
    const session: AuthSession = {
        AccessToken: '',
        RefreshToken: '',
        RefreshTime: -1,
        keyPassword: 'keypassword-test',
        lockMode: LockMode.PASSWORD,
        UID: 'UID-test',
        UserID: 'userID-test',
        offlineKD: 'offlineKD-test',
        sessionLockToken: 'sessionLockToken-test',
        payloadVersion: 2,
        sso: false,
    };

    const withLaunchPassword = (): AuthSession => ({
        ...session,
        lockPasswordOnLaunch: true,
        offlineConfig: { salt: 'salt', params: {} as any },
        offlineKD: uint8ArrayToString(generateKey()),
        offlineVerifier: 'offline-verifier',
    });

    beforeEach(() => {
        (global as any).DESKTOP_BUILD = false;
        (global as any).EXTENSION_BUILD = true;
    });

    const encryptSession = async (authSession = session) => {
        const clientKey = await importSymmetricKey(generateKey());
        const data = JSON.parse(await encryptPersistedSessionWithKey(authSession, clientKey));
        return { clientKey, data };
    };

    const decryptClientBlob = async (clientKey: CryptoKey, blob: string) =>
        JSON.parse(await getDecryptedBlob(clientKey, blob, getSessionEncryptionTag(2)));

    const setupResumeSession = async () => {
        const { serializedData, key: clientKey } = await generateClientKey();
        const authStore = createAuthStore(createMemoryStore());
        authStore.setClientKey(serializedData);
        return { authStore, clientKey };
    };

    const resumeConfig = (authStore: ReturnType<typeof createAuthStore>, UserID: string) =>
        ({
            api: jest.fn().mockResolvedValue({ User: { ID: UserID } }),
            authStore,
            getPersistedSession: jest.fn(),
            onInit: jest.fn(),
            onSessionFailure: jest.fn(),
        }) as any;

    describe('`getSessionEncryptionTag`', () => {
        test('should return correct tag for `payloadVersion: 2`', () => {
            const tag = new Uint8Array([115, 101, 115, 115, 105, 111, 110]); // 'session'
            expect(getSessionEncryptionTag(2)).toStrictEqual(tag);
        });

        test('should return `undefined` for "untagged" sessions', () => {
            expect(getSessionEncryptionTag()).toEqual(undefined);
        });
    });

    describe('`encryptPersistedSessionWithKey`', () => {
        test('should encrypt sensitive components in the encrypted blob', async () => {
            const { clientKey, data } = await encryptSession();

            expect(data.blob).toBeDefined();
            expect(data.keyPassword).not.toBeDefined();
            expect(data.offlineKD).not.toBeDefined();
            expect(data.sessionLockToken).not.toBeDefined();

            const decryptedData = await decryptClientBlob(clientKey, data.blob);

            expect(decryptedData.keyPassword).toEqual(session.keyPassword);
            expect(decryptedData.offlineKD).toEqual(session.offlineKD);
            expect(decryptedData.sessionLockToken).toEqual(session.sessionLockToken);
            expect(decryptedData.digest).toBeDefined();
        });

        test('should compute an integrity digest of the session data', async () => {
            const { clientKey, data } = await encryptSession();
            const decryptedData = await decryptClientBlob(clientKey, data.blob);
            const digest = await digestSession(session, SESSION_DIGEST_VERSION);

            expect(decryptedData.digest).toEqual(digest);
        });

        test('should password-wrap sensitive components for launch password lock', async () => {
            const protectedSession = withLaunchPassword();
            const { clientKey, data } = await encryptSession(protectedSession);

            expect(data.launchPasswordBlob).toBeDefined();
            expect(data.lockPasswordOnLaunch).toBe(true);

            const clientBlobData = await decryptClientBlob(clientKey, data.blob);

            expect(clientBlobData.keyPassword).not.toEqual(protectedSession.keyPassword);
            expect(clientBlobData.offlineKD).not.toBeDefined();
            expect(clientBlobData.sessionLockToken).not.toBeDefined();

            const launchBlobData = await decryptLaunchPasswordSessionBlob(
                protectedSession.offlineKD,
                data.launchPasswordBlob
            );

            expect(launchBlobData.keyPassword).toEqual(protectedSession.keyPassword);
            expect(launchBlobData.offlineKD).toEqual(protectedSession.offlineKD);
            expect(launchBlobData.sessionLockToken).toEqual(protectedSession.sessionLockToken);
            expect(launchBlobData.digest).toBeDefined();
        });

        test('should default launch password protection to enabled when offline material exists', async () => {
            const protectedSession = { ...withLaunchPassword(), lockPasswordOnLaunch: undefined };
            const { data } = await encryptSession(protectedSession);

            expect(data.lockPasswordOnLaunch).toBe(true);
            expect(data.launchPasswordBlob).toBeDefined();
        });

        test('should keep the normal client-key blob when launch password lock is disabled', async () => {
            const protectedSession = { ...withLaunchPassword(), lockPasswordOnLaunch: false };
            const { clientKey, data } = await encryptSession(protectedSession);

            expect(data.launchPasswordBlob).not.toBeDefined();

            const clientBlobData = await decryptClientBlob(clientKey, data.blob);

            expect(clientBlobData.keyPassword).toEqual(protectedSession.keyPassword);
            expect(clientBlobData.offlineKD).toEqual(protectedSession.offlineKD);
            expect(clientBlobData.sessionLockToken).toEqual(protectedSession.sessionLockToken);
        });
    });

    describe('`requiresLaunchPasswordUnlock`', () => {
        test.each([
            [
                'force password when the protected launch blob exists',
                { launchPasswordBlob: 'blob', lockPasswordOnLaunch: false },
                true,
            ],
            [
                'default to password when local password material exists',
                { offlineConfig: {} as any, offlineVerifier: 'verifier' },
                true,
            ],
            [
                'allow explicitly disabled launch password lock',
                { lockPasswordOnLaunch: false, offlineConfig: {} as any, offlineVerifier: 'verifier' },
                false,
            ],
        ])('should %s', (_, persistedSession, expected) => {
            expect(requiresLaunchPasswordUnlock(persistedSession)).toBe(expected);
        });
    });

    describe('`resumeSession`', () => {
        test('should reject a protected client blob when the launch blob is missing', async () => {
            const { authStore, clientKey } = await setupResumeSession();
            const protectedSession = withLaunchPassword();
            const encryptedSession = JSON.parse(await encryptPersistedSessionWithKey(protectedSession, clientKey));
            const { launchPasswordBlob, ...tamperedSession } = encryptedSession;

            authStore.setSession(tamperedSession);

            await expect(
                resumeSession(
                    tamperedSession,
                    protectedSession.LocalID,
                    resumeConfig(authStore, protectedSession.UserID),
                    {
                        unlocked: true,
                    }
                )
            ).rejects.toThrow('Missing launch password session blob');

            expect(launchPasswordBlob).toBeDefined();
        });

        test('should repersist legacy launch-password sessions without a protected blob', async () => {
            const { authStore, clientKey } = await setupResumeSession();
            const legacySession = withLaunchPassword();
            const digest = await digestSession(legacySession, SESSION_DIGEST_VERSION);
            const blob = await getEncryptedBlob(
                clientKey,
                JSON.stringify({
                    keyPassword: legacySession.keyPassword,
                    offlineKD: legacySession.offlineKD,
                    sessionLockToken: legacySession.sessionLockToken,
                    digest,
                }),
                getSessionEncryptionTag(2)
            );
            const { keyPassword, offlineKD, sessionLockToken, ...persistedSession } = legacySession;

            authStore.setSession(persistedSession);

            const result = await resumeSession(
                { ...persistedSession, blob },
                legacySession.LocalID,
                resumeConfig(authStore, legacySession.UserID),
                { unlocked: true }
            );

            expect(result.repersist).toBe(true);
            expect(result.session.keyPassword).toBe(keyPassword);
            expect(result.session.offlineKD).toBe(offlineKD);
            expect(result.session.sessionLockToken).toBe(sessionLockToken);
        });
    });
});
