import type { RotationKey } from '../../../../types';
import { PassEncryptionTag } from '../../../../types';
import { decryptData, importSymmetricKey } from '../../utils/crypto-helpers';
import { PassCryptoFileError } from '../../utils/errors';
import { type FileDescriptorProcessResult, getFileMetadataEncryptionTag } from './create-file-descriptor';

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
