import { getFileChunkEncryptionTag } from '@proton/pass/lib/crypto/processes/file/create-file-chunk';
import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';

export const openFileChunk = async (
    chunk: Uint8Array<ArrayBuffer>,
    chunkIndex: number,
    totalChunks: number,
    fileKey: Uint8Array<ArrayBuffer>,
    encryptionVersion: number
): Promise<Uint8Array<ArrayBuffer>> => {
    const key = await importSymmetricKey(fileKey);
    const tag = getFileChunkEncryptionTag(chunkIndex, totalChunks, encryptionVersion);

    return decryptData(key, chunk, tag);
};
