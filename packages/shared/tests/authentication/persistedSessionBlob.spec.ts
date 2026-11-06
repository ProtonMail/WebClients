import { generateKey, importKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { utf8StringToUint8Array } from '@protontech/crypto/utils';

import { type PersistedSession, SessionSource } from '../../lib/authentication/SessionInterface';
import {
    getDecryptedPersistedSessionBlob,
    getPersistedSessionData,
} from '../../lib/authentication/persistedSessionStorage';
import { selfAccessTypeMask } from '../../lib/authentication/sessionAccessType';
import { getEncryptedBlob, getEncryptedBlobV3 } from '../../lib/authentication/sessionBlobCryptoHelper';

const getKey = () => importKey(generateKey());
const blobData = JSON.stringify({ keyPassword: 'key-password' });

describe('getDecryptedPersistedSessionBlob', () => {
    it('should read a version 1 blob, which carries no additional data', async () => {
        const key = await getKey();
        const blob = await getEncryptedBlob(key, blobData);
        await expect(getDecryptedPersistedSessionBlob(key, blob, 1)).resolves.toEqual({
            type: 'default',
            keyPassword: 'key-password',
        });
    });

    it('should read a version 2 blob, which is tagged with `session`', async () => {
        const key = await getKey();
        const blob = await getEncryptedBlob(key, blobData, utf8StringToUint8Array('session'));
        await expect(getDecryptedPersistedSessionBlob(key, blob, 2)).resolves.toEqual({
            type: 'default',
            keyPassword: 'key-password',
        });
    });

    it('should read a version 3 blob, which is tagged with `session` and uses a 12 byte IV', async () => {
        const key = await getKey();
        const blob = await getEncryptedBlobV3(key, blobData, utf8StringToUint8Array('session'));
        await expect(getDecryptedPersistedSessionBlob(key, blob, 3)).resolves.toEqual({
            type: 'default',
            keyPassword: 'key-password',
        });
    });

    it.each([1, 2, 3] as PersistedSession['payloadVersion'][])(
        'should reject a version %i blob that was written for another version',
        async (payloadVersion) => {
            const key = await getKey();
            const blob = await getEncryptedBlobV3(key, blobData, utf8StringToUint8Array('fork'));
            await expect(getDecryptedPersistedSessionBlob(key, blob, payloadVersion)).rejects.toThrow(
                'Failed to decrypt persisted blob'
            );
        }
    );
});

describe('getPersistedSessionData', () => {
    it('should write a version 3 blob that can be read back', async () => {
        const key = await getKey();
        const { blob, payloadVersion } = await getPersistedSessionData(1, key, {
            UserID: 'user-id',
            UID: 'uid',
            keyPassword: 'key-password',
            offlineKey: undefined,
            accessTypeMask: selfAccessTypeMask,
            persistent: true,
            trusted: false,
            persistedAt: 0,
            source: SessionSource.Proton,
        });
        expect(payloadVersion).toBe(3);
        await expect(getDecryptedPersistedSessionBlob(key, blob!, payloadVersion)).resolves.toEqual({
            type: 'default',
            keyPassword: 'key-password',
        });
    });
});
