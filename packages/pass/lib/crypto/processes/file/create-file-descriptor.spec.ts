import { decryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoError, PassCryptoFileError } from '@proton/pass/lib/crypto/utils/errors';
import { PassEncryptionTag } from '@proton/pass/types';

import { createFileDescriptor, getFileMetadataEncryptionTag } from './create-file-descriptor';

describe('`getFileMetadataEncryptionTag`', () => {
    test('should return FileData tag for encryption version 1', () => {
        const result = getFileMetadataEncryptionTag(1);
        expect(result).toBe(PassEncryptionTag.FileData);
    });

    test('should return FileMetadataV2 tag for encryption version 2', () => {
        const result = getFileMetadataEncryptionTag(2);
        expect(result).toBe(PassEncryptionTag.FileMetadataV2);
    });

    test('should throw an error for unsupported encryption versions', () => {
        expect(() => getFileMetadataEncryptionTag(0)).toThrow(PassCryptoError);
        expect(() => getFileMetadataEncryptionTag(3)).toThrow(PassCryptoError);
        expect(() => getFileMetadataEncryptionTag(-1)).toThrow(PassCryptoError);
    });
});

describe('`createFileDescriptor` crypto process', () => {
    const mockMetadata = new Uint8Array([1, 2, 3, 4, 5]);

    test('should create file descriptor with auto-generated key for version 1', async () => {
        const result = await createFileDescriptor(mockMetadata, 1);

        expect(result.fileKey instanceof Uint8Array).toBe(true);
        expect(result.metadata instanceof Uint8Array).toBe(true);

        const key = await importSymmetricKey(result.fileKey);
        const decryptedMetadata = await decryptData(key, result.metadata, PassEncryptionTag.FileData);

        expect(decryptedMetadata).toStrictEqual(mockMetadata);
    });

    test('should create file descriptor with auto-generated key for version 2', async () => {
        const result = await createFileDescriptor(mockMetadata, 2);

        expect(result.fileKey instanceof Uint8Array).toBe(true);
        expect(result.metadata instanceof Uint8Array).toBe(true);

        const key = await importSymmetricKey(result.fileKey);
        const decryptedMetadata = await decryptData(key, result.metadata, PassEncryptionTag.FileMetadataV2);

        expect(decryptedMetadata).toStrictEqual(mockMetadata);
    });

    test('should use provided file key', async () => {
        const fileKey = generateKey();
        const result = await createFileDescriptor(mockMetadata, 1, fileKey);

        expect(result.fileKey).toBe(fileKey);

        const key = await importSymmetricKey(fileKey);
        const decryptedMetadata = await decryptData(key, result.metadata, PassEncryptionTag.FileData);

        expect(decryptedMetadata).toStrictEqual(mockMetadata);
    });

    test('should throw for empty metadata', async () => {
        await expect(createFileDescriptor(new Uint8Array([]), 1)).rejects.toThrow(PassCryptoFileError);
    });

    test('should throw for unsupported encryption version', async () => {
        await expect(createFileDescriptor(mockMetadata, 3)).rejects.toThrow(PassCryptoError);
    });
});
