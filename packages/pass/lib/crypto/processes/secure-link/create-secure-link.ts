import { encryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { ShareKey } from '@proton/pass/types';
import { type ItemKey, PassEncryptionTag } from '@proton/pass/types';

type CreateSecureLinkProcessParams = {
    itemKey: ItemKey;
    shareKey: ShareKey | ItemKey;
};

export type CreateSecureLinkData = {
    encryptedItemKey: Uint8Array;
    encryptedLinkKey: Uint8Array;
    secureLinkKey: Uint8Array;
    keyRotation: number;
    linkKeyEncryptedWithItemKey: boolean;
};

/** Note: for secure-links created from shared items,
 * itemKey == shareKey. As such we're encrypting the
 * secure-link key with the key being encrypted with
 * the secure-link. */
export const createSecureLink = async ({
    itemKey,
    shareKey,
}: CreateSecureLinkProcessParams): Promise<CreateSecureLinkData> => {
    const secureLinkKey = generateKey();

    const encryptedItemKey = await encryptData(
        await importSymmetricKey(secureLinkKey),
        itemKey.raw,
        PassEncryptionTag.ItemKey
    );

    const encryptedLinkKey = await encryptData(shareKey.key, secureLinkKey, PassEncryptionTag.LinkKey);

    return {
        encryptedItemKey,
        encryptedLinkKey,
        secureLinkKey,
        keyRotation: shareKey.rotation,
        linkKeyEncryptedWithItemKey: itemKey == shareKey,
    };
};
