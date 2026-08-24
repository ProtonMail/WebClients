import type { ItemKey } from '../../../../types';
import { generateKey, importSymmetricKey } from '../../utils/crypto-helpers';
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
        const encryptedLinkKeyBase64 = secureLink.encryptedLinkKey.toBase64();
        const decryptedLinkKey = await openLinkKey({
            encryptedLinkKey: encryptedLinkKeyBase64,
            key: itemKey.key,
        });

        expect(decryptedLinkKey).toStrictEqual(secureLink.secureLinkKey);
    });
});
