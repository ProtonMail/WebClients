import { generateKey } from '@proton/crypto/lib/subtle/aesGcm';
import { encryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoFileError } from '@proton/pass/lib/crypto/utils/errors';
import { PassEncryptionTag } from '@proton/pass/types';

export type FileDescriptorProcessResult = {
    /** Raw file key contents */
    fileKey: Uint8Array;
    /** Decrypted file metadata  */
    metadata: Uint8Array;
};

/** If `fileKey` is not provided we will attempt to create
 * one. This should only happen during initial file metadata
 * registration. If this happens during an update, the metadata
 * won't be decryptable as the file key won't be registered */
export const createFileDescriptor = async (
    encodedMetadata: Uint8Array,
    fileKey?: Uint8Array
): Promise<FileDescriptorProcessResult> => {
    if (encodedMetadata.length === 0) throw new PassCryptoFileError('File content cannot be empty');

    const rawFileKey = fileKey ?? generateKey();
    const key = await importSymmetricKey(rawFileKey);
    const encryptedMetadata = await encryptData(key, encodedMetadata, PassEncryptionTag.FileData);

    return {
        fileKey: rawFileKey,
        metadata: encryptedMetadata,
    };
};
