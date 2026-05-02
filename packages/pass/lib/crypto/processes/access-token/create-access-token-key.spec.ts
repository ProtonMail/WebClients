import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { createRandomKey, releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';

import { createAccessTokenKey } from './create-access-token-key';

describe('createAccessTokenKey crypto process', () => {
    beforeAll(setupCryptoProxyForTesting);
    afterAll(releaseCryptoProxy);

    test('should generate a 32-byte raw key, encrypt and sign it', async () => {
        const key = await createRandomKey();
        const { raw, encrypted } = await createAccessTokenKey(key.publicKey, key.privateKey);

        expect(raw).toBeInstanceOf(Uint8Array);
        expect(raw.byteLength).toBe(32);

        const { data, verificationStatus } = await CryptoProxy.decryptMessage({
            binaryMessage: Uint8Array.fromBase64(encrypted),
            decryptionKeys: key.privateKey,
            verificationKeys: key.publicKey,
            format: 'binary',
        });

        expect(verificationStatus).toBe(VERIFICATION_STATUS.SIGNED_AND_VALID);
        expect(data).toStrictEqual(raw);
    });

    test('should produce a different raw key on each call', async () => {
        const key = await createRandomKey();
        const a = await createAccessTokenKey(key.publicKey, key.privateKey);
        const b = await createAccessTokenKey(key.publicKey, key.privateKey);
        expect(a.raw).not.toStrictEqual(b.raw);
    });
});
