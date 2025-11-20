import { createFileDescriptor } from '@proton/pass/lib/crypto/processes/file/create-file-descriptor';
import { encryptData } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoFileError } from '@proton/pass/lib/crypto/utils/errors';
import { createRandomItemKey } from '@proton/pass/lib/crypto/utils/testing';
import { PassEncryptionTag } from '@proton/pass/types';

import { openFileDescriptor } from './open-file-descriptor';

describe('`openFileDescriptor` crypto process', () => {
    const mockMetadata = new Uint8Array([1, 2, 3, 4, 5]);

    test('should decrypt file descriptor for encryption version 1', async () => {
        const itemKey = await createRandomItemKey(1);
        const fileDescriptor = await createFileDescriptor(mockMetadata, 1);
        const encryptedFileKey = await encryptData(itemKey.key, fileDescriptor.fileKey, PassEncryptionTag.FileKey);

        const encryptedMetadata = fileDescriptor.metadata.toBase64();
        const encryptedFileKeyBase64 = encryptedFileKey.toBase64();
        const result = await openFileDescriptor(encryptedMetadata, encryptedFileKeyBase64, itemKey, 1);

        expect(result.fileKey).toEqual(fileDescriptor.fileKey);
        expect(result.metadata).toEqual(mockMetadata);
    });

    test('should decrypt file descriptor for encryption version 2', async () => {
        const itemKey = await createRandomItemKey(1);
        const fileDescriptor = await createFileDescriptor(mockMetadata, 2);
        const encryptedFileKey = await encryptData(itemKey.key, fileDescriptor.fileKey, PassEncryptionTag.FileKey);

        const encryptedMetadata = fileDescriptor.metadata.toBase64();
        const encryptedFileKeyBase64 = encryptedFileKey.toBase64();
        const result = await openFileDescriptor(encryptedMetadata, encryptedFileKeyBase64, itemKey, 2);

        expect(result.fileKey).toEqual(fileDescriptor.fileKey);
        expect(result.metadata).toEqual(mockMetadata);
    });

    test('should throw for empty metadata', async () => {
        const itemKey = await createRandomItemKey(1);
        const fileDescriptor = await createFileDescriptor(mockMetadata, 1);
        const encryptedFileKey = await encryptData(itemKey.key, fileDescriptor.fileKey, PassEncryptionTag.FileKey);

        const encryptedFileKeyBase64 = encryptedFileKey.toBase64();
        await expect(openFileDescriptor('', encryptedFileKeyBase64, itemKey, 1)).rejects.toThrow(PassCryptoFileError);
    });

    test('should throw when decryption fails due to incorrect keys', async () => {
        const itemKey = await createRandomItemKey(1);
        const otherItemKey = await createRandomItemKey(1);
        const fileDescriptor = await createFileDescriptor(mockMetadata, 1);
        const encryptedFileKey = await encryptData(itemKey.key, fileDescriptor.fileKey, PassEncryptionTag.FileKey);

        const encryptedMetadata = fileDescriptor.metadata.toBase64();
        const encryptedFileKeyBase64 = encryptedFileKey.toBase64();

        await expect(openFileDescriptor(encryptedMetadata, encryptedFileKeyBase64, otherItemKey, 1)).rejects.toThrow();
    });
});
