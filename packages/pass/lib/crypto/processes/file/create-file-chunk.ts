import { encryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import { blobToUint8Array, uint8ArrayToBlob } from '@proton/shared/lib/helpers/encoding';

export const createFileChunk = async (chunk: Blob, fileKey: Uint8Array): Promise<Blob> => {
    const key = await importSymmetricKey(fileKey);
    const data = await blobToUint8Array(chunk);

    const encryptedChunk = await encryptData(key, data, PassEncryptionTag.FileData);
    return uint8ArrayToBlob(encryptedChunk);
};
