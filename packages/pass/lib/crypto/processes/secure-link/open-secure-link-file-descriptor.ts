import {
    type FileDescriptorProcessResult,
    getFileMetadataEncryptionTag,
    openItemKey,
} from '@proton/pass/lib/crypto/processes';
import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';

type Params = {
    encryptedFileKey: string;
    encryptedItemKey: string;
    encryptedMetadata: string;
    encryptionVersion: number;
    linkKey: string;
};

export const openSecureLinkFileDescriptor = async ({
    encryptedFileKey,
    encryptedItemKey,
    encryptedMetadata,
    encryptionVersion,
    linkKey,
}: Params): Promise<FileDescriptorProcessResult> => {
    const raw = Uint8Array.fromBase64(linkKey, { alphabet: 'base64url' });
    const itemKey = (
        await openItemKey({
            encryptedItemKey: { Key: encryptedItemKey, KeyRotation: 0 },
            shareKey: { key: await importSymmetricKey(raw), raw, rotation: 0, userKeyId: undefined },
        })
    ).key;

    const secureFileKey = await decryptData(
        itemKey,
        Uint8Array.fromBase64(encryptedFileKey),
        PassEncryptionTag.FileKey
    );

    return {
        metadata: await decryptData(
            await importSymmetricKey(secureFileKey),
            Uint8Array.fromBase64(encryptedMetadata),
            getFileMetadataEncryptionTag(encryptionVersion)
        ),
        fileKey: secureFileKey,
    };
};
