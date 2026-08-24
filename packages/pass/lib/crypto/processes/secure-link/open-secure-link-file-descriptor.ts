import { PassEncryptionTag } from '../../../../types';
import { decryptData, importSymmetricKey } from '../../utils/crypto-helpers';
import { type FileDescriptorProcessResult, getFileMetadataEncryptionTag } from '../file/create-file-descriptor';
import { openItemKey } from '../item/open-item-key';

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
