import { generateKey, importSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import type { ItemKey } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { createSecureLink } from './create-secure-link';
import { openLinkKey } from './open-link-key';

describe('`openLinkKey` crypto process', () => {
    test('should decrypt link key correctly using share key', async () => {
        const rawItemKey = generateKey();

        const itemKey: ItemKey = {
            key: await importSymmetricKey(rawItemKey),
            raw: rawItemKey,
            rotation: 1,
        };

        const secureLink = await createSecureLink({ itemKey });
        const encryptedLinkKeyBase64 = uint8ArrayToBase64String(secureLink.encryptedLinkKey);
        const decryptedLinkKey = await openLinkKey({
            encryptedLinkKey: encryptedLinkKeyBase64,
            key: itemKey.key,
        });

        expect(decryptedLinkKey).toStrictEqual(secureLink.secureLinkKey);
    });
});
