import { generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { getDecryptedBlob } from '@proton/shared/lib/authentication/sessionBlobCryptoHelper';

import { SESSION_DIGEST_VERSION, digestSession } from './integrity';
import { LockMode } from './lock/types';
import { type AuthSession, encryptPersistedSessionWithKey, getSessionEncryptionTag } from './session';

describe('Session utilities', () => {
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
        };

        test('should encrypt sensitive components in the encrypted blob', async () => {
            const clientKey = await importSymmetricKey(generateKey());
            const result = await encryptPersistedSessionWithKey(session, clientKey);
            const data = JSON.parse(result);

            expect(data.blob).toBeDefined();
            expect(data.keyPassword).not.toBeDefined();
            expect(data.offlineKD).not.toBeDefined();
            expect(data.sessionLockToken).not.toBeDefined();

            const decrypted = await getDecryptedBlob(clientKey, data.blob, getSessionEncryptionTag(2));
            const decryptedData = JSON.parse(decrypted);

            expect(decryptedData.keyPassword).toEqual(session.keyPassword);
            expect(decryptedData.offlineKD).toEqual(session.offlineKD);
            expect(decryptedData.sessionLockToken).toEqual(session.sessionLockToken);
            expect(decryptedData.digest).toBeDefined();
        });

        test('should compute an integrity digest of the session data', async () => {
            const clientKey = await importSymmetricKey(generateKey());
            const result = await encryptPersistedSessionWithKey(session, clientKey);
            const decrypted = await getDecryptedBlob(clientKey, JSON.parse(result).blob, getSessionEncryptionTag(2));
            const decryptedData = JSON.parse(decrypted);

            const digest = await digestSession(session, SESSION_DIGEST_VERSION);
            expect(decryptedData.digest).toEqual(digest);
        });
    });
});
