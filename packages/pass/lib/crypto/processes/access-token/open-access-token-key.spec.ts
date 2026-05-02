import { createRandomKey, releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';

import { createAccessTokenKey } from './create-access-token-key';
import { openAccessTokenKey } from './open-access-token-key';

describe('openAccessTokenKey crypto process', () => {
    beforeAll(setupCryptoProxyForTesting);
    afterAll(releaseCryptoProxy);

    test('should decrypt and return the original raw key', async () => {
        const key = await createRandomKey();
        const { raw, encrypted } = await createAccessTokenKey(key.publicKey, key.privateKey);
        const result = await openAccessTokenKey(encrypted, key.privateKey, key.publicKey);
        expect(result).toStrictEqual(raw);
    });

    test('should throw when signature verification fails', async () => {
        const keyA = await createRandomKey();
        const keyB = await createRandomKey();
        const { encrypted } = await createAccessTokenKey(keyA.publicKey, keyA.privateKey);
        await expect(openAccessTokenKey(encrypted, keyA.privateKey, keyB.publicKey)).rejects.toThrow();
    });
});
