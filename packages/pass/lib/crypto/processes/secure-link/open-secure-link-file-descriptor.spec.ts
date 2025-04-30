import { createFileDescriptor } from '@proton/pass/lib/crypto/processes/file/create-file-descriptor';
import { encryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { createRandomItemKey } from '@proton/pass/lib/crypto/utils/testing';
import { PassEncryptionTag } from '@proton/pass/types';
import { encodeBase64URL, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

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
            encryptedFileKey: uint8ArrayToBase64String(encryptedFileKey),
            encryptedItemKey: uint8ArrayToBase64String(secureLinkData.encryptedItemKey),
            encryptedMetadata: uint8ArrayToBase64String(fileDescriptor.metadata),
            encryptionVersion: 1,
            linkKey: encodeBase64URL(String.fromCharCode(...secureLinkData.secureLinkKey)),
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
            encryptedFileKey: uint8ArrayToBase64String(encryptedFileKey),
            encryptedItemKey: uint8ArrayToBase64String(secureLinkData.encryptedItemKey),
            encryptedMetadata: uint8ArrayToBase64String(fileDescriptor.metadata),
            encryptionVersion: 2,
            linkKey: encodeBase64URL(String.fromCharCode(...secureLinkData.secureLinkKey)),
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
                encryptedFileKey: uint8ArrayToBase64String(encryptedFileKey),
                encryptedItemKey: uint8ArrayToBase64String(secureLinkData.encryptedItemKey),
                encryptedMetadata: uint8ArrayToBase64String(fileDescriptor.metadata),
                encryptionVersion: 1,
                linkKey: encodeBase64URL(String.fromCharCode(...secureLinkData.secureLinkKey)),
            })
        ).rejects.toThrow();
    });
});
