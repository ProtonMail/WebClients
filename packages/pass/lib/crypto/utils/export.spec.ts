import { decryptPassExport, encryptPassExport } from '@proton/pass/lib/crypto/utils/export';
import { randomContents, releaseCryptoProxy, setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';

describe('PGP Exporting', () => {
    beforeAll(async () => setupCryptoProxyForTesting());
    afterAll(async () => releaseCryptoProxy());

    test('should work E2E', async () => {
        const data = randomContents(256);
        const encrypted = await encryptPassExport(data, 'p4ssphr4se');
        const decrypted = await decryptPassExport(encrypted, 'p4ssphr4se');

        expect(decrypted).toEqual(data);
    });

    test('should throw if no `passphrase` provided', async () => {
        const data = randomContents(256);
        await expect(() => encryptPassExport(data, '')).rejects.toThrow();
    });

    test('should throw when trying to decrypt with wrong passphrase', async () => {
        const data = randomContents(256);
        const encrypted = await encryptPassExport(data, 'p4ssphr4se');
        await expect(() => decryptPassExport(encrypted, '000')).rejects.toThrow();
    });
});
