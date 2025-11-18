import { openItemKey } from '@proton/pass/lib/crypto/processes';
import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';

type OpenSecureLinkParams = { encryptedItemKey: string; content: string; linkKey: string };

export const openSecureLink = async ({
    encryptedItemKey,
    content,
    linkKey,
}: OpenSecureLinkParams): Promise<Uint8Array<ArrayBuffer>> => {
    const raw = Uint8Array.fromBase64(linkKey, { alphabet: 'base64url' });
    const itemKey = (
        await openItemKey({
            encryptedItemKey: { Key: encryptedItemKey, KeyRotation: 0 },
            shareKey: { key: await importSymmetricKey(raw), raw, rotation: 0, userKeyId: undefined },
        })
    ).key;

    return decryptData(itemKey, Uint8Array.fromBase64(content), PassEncryptionTag.ItemContent);
};
