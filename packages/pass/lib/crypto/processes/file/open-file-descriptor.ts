import {
    type FileDescriptorProcessResult,
    getFileMetadataEncryptionTag,
} from '@proton/pass/lib/crypto/processes/file/create-file-descriptor';
import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoFileError } from '@proton/pass/lib/crypto/utils/errors';
import type { RotationKey } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';

export const openFileDescriptor = async (
    encryptedMetadata: string,
    encryptedFileKey: string,
    itemKey: RotationKey,
    encryptionVersion: number
): Promise<FileDescriptorProcessResult> => {
    if (encryptedMetadata.length === 0) throw new PassCryptoFileError('File content cannot be empty');

    const fileKeyRaw = await decryptData(
        itemKey.key,
        base64StringToUint8Array(encryptedFileKey),
        PassEncryptionTag.FileKey
    );

    const fileKey = await importSymmetricKey(fileKeyRaw);
    const metadata = await decryptData(
        fileKey,
        base64StringToUint8Array(encryptedMetadata),
        getFileMetadataEncryptionTag(encryptionVersion)
    );

    return { metadata, fileKey: fileKeyRaw };
};
