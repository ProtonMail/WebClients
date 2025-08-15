import { encryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { type ItemKey, PassEncryptionTag } from '@proton/pass/types';

type CreateSecureLinkProcessParams = { itemKey: ItemKey };

export type CreateSecureLinkData = {
    encryptedItemKey: Uint8Array<ArrayBuffer>;
    encryptedLinkKey: Uint8Array<ArrayBuffer>;
    secureLinkKey: Uint8Array<ArrayBuffer>;
    keyRotation: number;
    linkKeyEncryptedWithItemKey: boolean;
};

export const createSecureLink = async ({ itemKey }: CreateSecureLinkProcessParams): Promise<CreateSecureLinkData> => {
    const secureLinkKey = generateKey();

    const encryptedItemKey = await encryptData(
        await importSymmetricKey(secureLinkKey),
        itemKey.raw,
        PassEncryptionTag.ItemKey
    );

    const encryptedLinkKey = await encryptData(itemKey.key, secureLinkKey, PassEncryptionTag.LinkKey);

    return {
        encryptedItemKey,
        encryptedLinkKey,
        secureLinkKey,
        keyRotation: itemKey.rotation,
        linkKeyEncryptedWithItemKey: true,
    };
};
