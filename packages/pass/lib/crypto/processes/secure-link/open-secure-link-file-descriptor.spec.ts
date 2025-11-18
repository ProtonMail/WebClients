import { createFileDescriptor } from '@proton/pass/lib/crypto/processes/file/create-file-descriptor';
import { encryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { createRandomItemKey } from '@proton/pass/lib/crypto/utils/testing';
import { PassEncryptionTag } from '@proton/pass/types';

import { createSecureLink } from './create-secure-link';
import { openSecureLinkFileDescriptor } from './open-secure-link-file-descriptor';

describe('`openSecureLinkFileDescriptor` crypto process', () => {
    const mockMetadata = new Uint8Array([1, 2, 3, 4, 5]);

    test('should decrypt file descriptor for encryption version 1', async () => {
        const itemKey = await createRandomItemKey(1);
        const fileDescriptor = await createFileDescriptor(mockMetadata, 1);
        const encryptedFileKey = await encryptData(itemKey.key, fileDescriptor.fileKey, PassEncryptionTag.FileKey);
        const secureLinkData = await createSecureLink({ itemKey });

        const result = await openSecureLinkFileDescriptor({
            encryptedFileKey: encryptedFileKey.toBase64(),
            encryptedItemKey: secureLinkData.encryptedItemKey.toBase64(),
            encryptedMetadata: fileDescriptor.metadata.toBase64(),
            encryptionVersion: 1,
            linkKey: secureLinkData.secureLinkKey.toBase64({ alphabet: 'base64url', omitPadding: true }),
        });

        expect(result.fileKey).toEqual(fileDescriptor.fileKey);
        expect(result.metadata).toEqual(mockMetadata);
    });

    test('should decrypt file descriptor for encryption version 2', async () => {
        const itemKey = await createRandomItemKey(1);
        const fileDescriptor = await createFileDescriptor(mockMetadata, 2);
        const encryptedFileKey = await encryptData(itemKey.key, fileDescriptor.fileKey, PassEncryptionTag.FileKey);
        const secureLinkData = await createSecureLink({ itemKey });

        const result = await openSecureLinkFileDescriptor({
            encryptedFileKey: encryptedFileKey.toBase64(),
            encryptedItemKey: secureLinkData.encryptedItemKey.toBase64(),
            encryptedMetadata: fileDescriptor.metadata.toBase64(),
            encryptionVersion: 2,
            linkKey: secureLinkData.secureLinkKey.toBase64({ alphabet: 'base64url', omitPadding: true }),
        });

        expect(result.fileKey).toEqual(fileDescriptor.fileKey);
        expect(result.metadata).toEqual(mockMetadata);
    });

    test('should throw when decryption fails due to incorrect keys', async () => {
        const itemKey = await createRandomItemKey(1);
        const otherItemKey = await createRandomItemKey(1);
        const fileDescriptor = await createFileDescriptor(mockMetadata, 1);
        const encryptedFileKey = await encryptData(itemKey.key, fileDescriptor.fileKey, PassEncryptionTag.FileKey);
        const secureLinkData = await createSecureLink({ itemKey: otherItemKey });

        await expect(
            openSecureLinkFileDescriptor({
                encryptedFileKey: encryptedFileKey.toBase64(),
                encryptedItemKey: secureLinkData.encryptedItemKey.toBase64(),
                encryptedMetadata: fileDescriptor.metadata.toBase64(),
                encryptionVersion: 1,
                linkKey: secureLinkData.secureLinkKey.toBase64({ alphabet: 'base64url', omitPadding: true }),
            })
        ).rejects.toThrow();
    });
});
