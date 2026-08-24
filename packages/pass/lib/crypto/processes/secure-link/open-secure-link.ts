import { PassEncryptionTag } from '../../../../types';
import { decryptData, importSymmetricKey } from '../../utils/crypto-helpers';
import { openItemKey } from '../item/open-item-key';

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
