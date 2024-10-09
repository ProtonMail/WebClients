import { encryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { type ItemKey, PassEncryptionTag, type VaultKey } from '@proton/pass/types';

type CreateSecureLinkProcessParams = { itemKey: ItemKey; vaultKey: VaultKey };

export type CreateSecureLinkData = {
    encryptedItemKey: Uint8Array;
    encryptedLinkKey: Uint8Array;
    secureLinkKey: Uint8Array;
};

export const createSecureLink = async ({
    itemKey,
    vaultKey,
}: CreateSecureLinkProcessParams): Promise<CreateSecureLinkData> => {
    const secureLinkKey = generateKey();

    const encryptedItemKey = await encryptData(
        await importSymmetricKey(secureLinkKey),
        itemKey.raw,
        PassEncryptionTag.ItemKey
    );

    const encryptedLinkKey = await encryptData(vaultKey.key, secureLinkKey, PassEncryptionTag.LinkKey);

    return { encryptedItemKey, encryptedLinkKey, secureLinkKey };
};
