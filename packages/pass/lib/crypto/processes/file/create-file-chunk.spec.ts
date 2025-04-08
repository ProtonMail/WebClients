import { decryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import { PassEncryptionTag } from '@proton/pass/types';
import { blobToUint8Array } from '@proton/shared/lib/helpers/encoding';

import { createFileChunk, getFileChunkEncryptionTag } from './create-file-chunk';

describe('`getFileChunkEncryptionTag`', () => {
    test('should return FileData tag for encryption version 1', () => {
        const result = getFileChunkEncryptionTag(0, 1, 1);
        expect(result).toBe(PassEncryptionTag.FileData);
    });

    test('should return formatted FileDataV2 tag for encryption version 2', () => {
        const result = getFileChunkEncryptionTag(2, 5, 2);
        expect(result).toBe('v2;2;5;filedata.item.pass.proton');
    });

    test('should throw an error for unsupported encryption versions', () => {
        expect(() => getFileChunkEncryptionTag(0, 1, 0)).toThrow(PassCryptoError);
        expect(() => getFileChunkEncryptionTag(0, 1, 3)).toThrow(PassCryptoError);
        expect(() => getFileChunkEncryptionTag(0, 1, -1)).toThrow(PassCryptoError);
    });
});

describe('`createFileChunk` crypto process', () => {
    const createMockChunk = () => new Blob(['test file chunk data']);
    const fileKey = generateKey();

    test('should encrypt chunk with correct tag for version 1', async () => {
        const mockChunk = createMockChunk();
        const chunkResult = await createFileChunk(mockChunk, 0, 1, fileKey, 1);

        const key = await importSymmetricKey(fileKey);
        const encryptedData = await blobToUint8Array(chunkResult);
        const decryptedData = await decryptData(key, encryptedData, PassEncryptionTag.FileData);

        const originalData = await blobToUint8Array(mockChunk);
        expect(decryptedData).toStrictEqual(originalData);
    });

    test('should encrypt chunk with correct tag for version 2', async () => {
        const mockChunk = createMockChunk();
        const chunkIndex = 2;
        const totalChunks = 5;
        const chunkResult = await createFileChunk(mockChunk, chunkIndex, totalChunks, fileKey, 2);

        const key = await importSymmetricKey(fileKey);
        const encryptedData = await blobToUint8Array(chunkResult);
        const tag = 'v2;2;5;filedata.item.pass.proton' as PassEncryptionTag;
        const decryptedData = await decryptData(key, encryptedData, tag);

        const originalData = await blobToUint8Array(mockChunk);
        expect(decryptedData).toStrictEqual(originalData);
    });

    test('should throw for unsupported encryption version', async () => {
        const mockChunk = createMockChunk();
        await expect(createFileChunk(mockChunk, 0, 1, fileKey, 3)).rejects.toThrow(PassCryptoError);
    });
});
