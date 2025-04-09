import {
    type FileDescriptorProcessResult,
    getFileMetadataEncryptionTag,
    openItemKey,
} from '@proton/pass/lib/crypto/processes';
import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array, decodeBase64URL, stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

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
    const raw = stringToUint8Array(decodeBase64URL(linkKey));
    const itemKey = (
        await openItemKey({
            encryptedItemKey: { Key: encryptedItemKey, KeyRotation: 0 },
            shareKey: { key: await importSymmetricKey(raw), raw, rotation: 0, userKeyId: undefined },
        })
    ).key;

    const secureFileKey = await decryptData(
        itemKey,
        base64StringToUint8Array(encryptedFileKey),
        PassEncryptionTag.FileKey
    );

    return {
        metadata: await decryptData(
            await importSymmetricKey(secureFileKey),
            base64StringToUint8Array(encryptedMetadata),
            getFileMetadataEncryptionTag(encryptionVersion)
        ),
        fileKey: secureFileKey,
    };
};
