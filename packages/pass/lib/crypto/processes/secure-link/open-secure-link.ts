import { openItemKey } from '@proton/pass/lib/crypto/processes';
import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array, decodeBase64URL, stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

type OpenSecureLinkParams = { encryptedItemKey: string; content: string; linkKey: string };

export const openSecureLink = async ({
    encryptedItemKey,
    content,
    linkKey,
}: OpenSecureLinkParams): Promise<Uint8Array<ArrayBuffer>> => {
    const raw = stringToUint8Array(decodeBase64URL(linkKey));
    const itemKey = (
        await openItemKey({
            encryptedItemKey: { Key: encryptedItemKey, KeyRotation: 0 },
            shareKey: { key: await importSymmetricKey(raw), raw, rotation: 0, userKeyId: undefined },
        })
    ).key;

    return decryptData(itemKey, base64StringToUint8Array(content), PassEncryptionTag.ItemContent);
};
