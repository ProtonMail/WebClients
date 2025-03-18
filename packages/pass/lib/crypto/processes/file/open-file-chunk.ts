import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';

export const openFileChunk = async (chunk: Uint8Array, fileKey: Uint8Array): Promise<Uint8Array> => {
    const key = await importSymmetricKey(fileKey);
    return decryptData(key, chunk, PassEncryptionTag.FileData);
};
