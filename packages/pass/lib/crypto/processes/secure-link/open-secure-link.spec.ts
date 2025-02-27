import { encryptData, generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { ItemKey } from '@proton/pass/types';
import { PassEncryptionTag } from '@proton/pass/types';
import { encodeBase64URL, stringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { createSecureLink } from './create-secure-link';
import { openSecureLink } from './open-secure-link';

describe('`openSecureLink` crypto process', () => {
    test('should work end-to-end with createSecureLink', async () => {
        const rawItemKey = generateKey();
        const rawShareKey = generateKey();
        const testContent = stringToUint8Array('Test secure link content data');

        const itemKey: ItemKey = {
            key: await importSymmetricKey(rawItemKey),
            raw: rawItemKey,
            rotation: 1,
        };

        const shareKey = {
            key: await importSymmetricKey(rawShareKey),
            raw: rawShareKey,
            rotation: 1,
            userKeyId: 'userkey-id',
        };

        const secureLink = await createSecureLink({ itemKey, shareKey });
        const encryptedContent = await encryptData(itemKey.key, testContent, PassEncryptionTag.ItemContent);

        const encryptedItemKeyBase64 = uint8ArrayToBase64String(secureLink.encryptedItemKey);
        const contentBase64 = uint8ArrayToBase64String(encryptedContent);
        const linkKeyBase64URL = encodeBase64URL(String.fromCharCode.apply(null, [...secureLink.secureLinkKey]));

        const decryptedContent = await openSecureLink({
            encryptedItemKey: encryptedItemKeyBase64,
            content: contentBase64,
            linkKey: linkKeyBase64URL,
        });

        expect(decryptedContent).toStrictEqual(testContent);
    });
});
