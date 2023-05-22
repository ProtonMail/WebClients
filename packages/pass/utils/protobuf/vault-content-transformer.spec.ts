import type { ShareContent, ShareType } from '@proton/pass/types';
import getRandomString from '@proton/utils/getRandomString';

import { decodeVaultContent, encodeVaultContent } from './vault-content-transformer';

describe('VaultContentTransformer', () => {
    it('should be able to encode and decode', () => {
        const source: ShareContent<ShareType.Vault> = {
            name: getRandomString(10),
            description: getRandomString(10),
            display: {},
        };

        const encoded = encodeVaultContent(source);
        expect(encoded.length).toBeGreaterThan(0);

        const decoded = decodeVaultContent(encoded);
        expect(decoded.name).toStrictEqual(source.name);
        expect(decoded.description).toStrictEqual(source.description);
    });
});
