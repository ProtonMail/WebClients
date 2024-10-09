import { decryptData, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassEncryptionTag } from '@proton/pass/types';
import { base64StringToUint8Array, decodeBase64URL, stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

type OpenSecureLinkParams = { encryptedItemKey: string; content: string; linkKey: string };

export const openSecureLink = async ({
    encryptedItemKey,
    content,
    linkKey,
}: OpenSecureLinkParams): Promise<Uint8Array> => {
    const secureLinkKey = await importSymmetricKey(stringToUint8Array(decodeBase64URL(linkKey)));

    const itemKey = await decryptData(
        secureLinkKey,
        base64StringToUint8Array(encryptedItemKey),
        PassEncryptionTag.ItemKey
    );

    return decryptData(
        await importSymmetricKey(itemKey),
        base64StringToUint8Array(content),
        PassEncryptionTag.ItemContent
    );
};
