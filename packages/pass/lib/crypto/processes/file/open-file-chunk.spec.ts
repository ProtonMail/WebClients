import { generateKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { blobToUint8Array, uint8ArrayToBlob } from '@proton/shared/lib/helpers/encoding';

import { createFileChunk } from './create-file-chunk';
import { openFileChunk } from './open-file-chunk';

describe('openFileChunk', () => {
    const chunkIndex = 2;
    const totalChunks = 5;
    const data = generateKey();
    const blob = uint8ArrayToBlob(data);

    test('should decrypt what was encrypted with v1', async () => {
        const fileKey = generateKey();
        const encryptedBlob = await createFileChunk(blob, chunkIndex, totalChunks, fileKey, 1);
        const encryptedData = await blobToUint8Array(encryptedBlob);
        const decryptedData = await openFileChunk(encryptedData, chunkIndex, totalChunks, fileKey, 1);

        expect(decryptedData).toEqual(data);
    });

    test('should decrypt what was encrypted with v2', async () => {
        const fileKey = generateKey();
        const encryptedBlob = await createFileChunk(blob, chunkIndex, totalChunks, fileKey, 2);
        const encryptedData = await blobToUint8Array(encryptedBlob);
        const decryptedData = await openFileChunk(encryptedData, chunkIndex, totalChunks, fileKey, 2);

        expect(decryptedData).toEqual(data);
    });

    test('should fail to decrypt with wrong version', async () => {
        const fileKey = generateKey();

        /** Encrypt with v1 */
        const encryptedBlob = await createFileChunk(blob, chunkIndex, totalChunks, fileKey, 1);
        const encryptedData = await blobToUint8Array(encryptedBlob);

        /** Decrypt with v2 */
        await expect(openFileChunk(encryptedData, chunkIndex, totalChunks, fileKey, 2)).rejects.toThrow();
    });

    test('should fail to decrypt with wrong chunk index', async () => {
        const fileKey = generateKey();
        const encryptedBlob = await createFileChunk(blob, chunkIndex, totalChunks, fileKey, 2);
        const encryptedData = await blobToUint8Array(encryptedBlob);

        await expect(openFileChunk(encryptedData, chunkIndex + 1, totalChunks, fileKey, 2)).rejects.toThrow();
    });

    test('should fail to decrypt with wrong total chunk', async () => {
        const fileKey = generateKey();
        const encryptedBlob = await createFileChunk(blob, chunkIndex, totalChunks, fileKey, 2);
        const encryptedData = await blobToUint8Array(encryptedBlob);

        await expect(openFileChunk(encryptedData, chunkIndex, totalChunks + 1, fileKey, 2)).rejects.toThrow();
    });
});
