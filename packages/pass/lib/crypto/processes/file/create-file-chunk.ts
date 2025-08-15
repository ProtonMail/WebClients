import { encryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import { PassEncryptionTag } from '@proton/pass/types';
import { blobToUint8Array, uint8ArrayToBlob } from '@proton/shared/lib/helpers/encoding';

export const getFileChunkEncryptionTag = (chunkIndex: number, totalChunks: number, encryptionVersion: number) => {
    switch (encryptionVersion) {
        case 1:
            return PassEncryptionTag.FileData;
        case 2:
            const base = PassEncryptionTag.FileDataV2;
            return base
                .replace('{chunkIndex}', chunkIndex.toString())
                .replace('{totalChunks}', totalChunks.toString()) as PassEncryptionTag;
        default:
            throw new PassCryptoError('Unsupported file encryption version');
    }
};

export const createFileChunk = async (
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    fileKey: Uint8Array<ArrayBuffer>,
    encryptionVersion: number
): Promise<Blob> => {
    const key = await importSymmetricKey(fileKey);
    const data = await blobToUint8Array(chunk);
    const tag = getFileChunkEncryptionTag(chunkIndex, totalChunks, encryptionVersion);

    const encryptedChunk = await encryptData(key, data, tag);
    return uint8ArrayToBlob(encryptedChunk);
};
