import {
    type FileDescriptorProcessResult,
    getFileMetadataEncryptionTag,
} from '@proton/pass/lib/crypto/processes/file/create-file-descriptor';
import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoFileError } from '@proton/pass/lib/crypto/utils/errors';
import type { RotationKey } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';

export const openFileDescriptor = async (
    encryptedMetadata: string,
    encryptedFileKey: string,
    itemKey: RotationKey,
    encryptionVersion: number
): Promise<FileDescriptorProcessResult> => {
    if (encryptedMetadata.length === 0) throw new PassCryptoFileError('File content cannot be empty');

    const fileKeyRaw = await decryptData(
        itemKey.key,
        Uint8Array.fromBase64(encryptedFileKey),
        PassEncryptionTag.FileKey
    );

    const fileKey = await importSymmetricKey(fileKeyRaw);
    const metadata = await decryptData(
        fileKey,
        Uint8Array.fromBase64(encryptedMetadata),
        getFileMetadataEncryptionTag(encryptionVersion)
    );

    return { metadata, fileKey: fileKeyRaw };
};
