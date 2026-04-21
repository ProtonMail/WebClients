import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { generateKeys, releaseCryptoProxy, setupCryptoProxyForTesting } from '../../../../utils/test/crypto';
import { CryptoProxyBridge } from './CryptoProxyBridge';

async function createTestDecryptedKeys(): Promise<DecryptedKey[]> {
    const { privateKeys, publicKeys } = await generateKeys();
    return [{ ID: 'test-key-id', privateKey: privateKeys[0], publicKey: publicKeys[0] }];
}

describe('CryptoProxyBridge', () => {
    beforeAll(() => setupCryptoProxyForTesting());
    afterAll(() => releaseCryptoProxy());

    let bridge: CryptoProxyBridge;

    beforeEach(async () => {
        const keys = await createTestDecryptedKeys();
        bridge = new CryptoProxyBridge(async () => keys);
    });

    it('openpgpEncryptIndexKey returns an armored OpenPGP message', async () => {
        const encrypted = await bridge.openpgpEncryptIndexKey('test-data');
        expect(encrypted).toContain('-----BEGIN PGP MESSAGE-----');
    });

    it('openpgpDecryptIndexKey recovers the original plaintext', async () => {
        const encrypted = await bridge.openpgpEncryptIndexKey('search-key-bytes');
        const decrypted = await bridge.openpgpDecryptIndexKey(encrypted);
        expect(decrypted).toBe('search-key-bytes');
    });

    it('round-trips base64 key material', async () => {
        const keyBytes = new Uint8Array([1, 2, 3, 42, 255]);
        const plaintext = keyBytes.toBase64();

        const encrypted = await bridge.openpgpEncryptIndexKey(plaintext);
        const decrypted = await bridge.openpgpDecryptIndexKey(encrypted);

        expect(Uint8Array.fromBase64(decrypted)).toEqual(keyBytes);
    });

    it('openpgpDecryptIndexKey fails on corrupted data', async () => {
        await expect(bridge.openpgpDecryptIndexKey('not-an-openpgp-message')).rejects.toThrow();
    });

    it('openpgpEncryptIndexKey throws when no user keys are available', async () => {
        const emptyBridge = new CryptoProxyBridge(async () => []);
        await expect(emptyBridge.openpgpEncryptIndexKey('data')).rejects.toThrow();
    });

    it('openpgpDecryptIndexKey throws when no user keys are available', async () => {
        const encrypted = await bridge.openpgpEncryptIndexKey('data');
        const emptyBridge = new CryptoProxyBridge(async () => []);
        await expect(emptyBridge.openpgpDecryptIndexKey(encrypted)).rejects.toThrow();
    });

    it('openpgpDecryptIndexKey fails with wrong key', async () => {
        const otherKeys = await createTestDecryptedKeys();
        const otherBridge = new CryptoProxyBridge(async () => otherKeys);

        const encrypted = await bridge.openpgpEncryptIndexKey('secret');
        await expect(otherBridge.openpgpDecryptIndexKey(encrypted)).rejects.toThrow();
    });
});
