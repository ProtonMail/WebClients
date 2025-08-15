import { generateKey } from '@proton/crypto/lib/subtle/aesGcm';
import { encryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoError, PassCryptoFileError } from '@proton/pass/lib/crypto/utils/errors';
import { PassEncryptionTag } from '@proton/pass/types';

export type FileDescriptorProcessResult = {
    /** Raw file key contents */
    fileKey: Uint8Array<ArrayBuffer>;
    /** Decrypted file metadata  */
    metadata: Uint8Array<ArrayBuffer>;
};

export const getFileMetadataEncryptionTag = (encryptionVersion: number) => {
    switch (encryptionVersion) {
        case 1:
            return PassEncryptionTag.FileData;
        case 2:
            return PassEncryptionTag.FileMetadataV2;
        default:
            throw new PassCryptoError('Unsupported file encryption version');
    }
};

/** If `fileKey` is not provided we will attempt to create
 * one. This should only happen during initial file metadata
 * registration. If this happens during an update, the metadata
 * won't be decryptable as the file key won't be registered */
export const createFileDescriptor = async (
    encodedMetadata: Uint8Array<ArrayBuffer>,
    encryptionVersion: number,
    fileKey?: Uint8Array<ArrayBuffer>
): Promise<FileDescriptorProcessResult> => {
    if (encodedMetadata.length === 0) throw new PassCryptoFileError('File content cannot be empty');

    const rawFileKey = fileKey ?? generateKey();
    const key = await importSymmetricKey(rawFileKey);
    const tag = getFileMetadataEncryptionTag(encryptionVersion);
    const encryptedMetadata = await encryptData(key, encodedMetadata, tag);

    return {
        fileKey: rawFileKey,
        metadata: encryptedMetadata,
    };
};
