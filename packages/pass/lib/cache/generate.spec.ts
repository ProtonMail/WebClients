import { createMemoryStore } from '../../utils/store';
import { createTestCache, hydrateTestPassCrypto } from '../../utils/tests/fixtures/cache';
import { releaseCryptoProxy, setupCryptoProxyForTesting } from '../../utils/tests/fixtures/crypto';
import { createTestOfflineComponents } from '../../utils/tests/fixtures/session';
import { createAuthStore } from '../auth/store';
import { PassCrypto } from '../crypto';
import { deobfuscateItem } from '../items/item.obfuscation';
import { decryptCache } from './decrypt';
import { getCacheKey } from './keys';

describe('cache generation', () => {
    beforeAll(() => setupCryptoProxyForTesting());
    afterAll(() => releaseCryptoProxy());

    const setup = async () => {
        const cryptoUser = await hydrateTestPassCrypto();
        const offline = await createTestOfflineComponents();
        const logins = [{ name: 'Bank', password: 'bank-pass' }];
        const cache = await createTestCache({ cryptoUser, offlineKD: offline.offlineKD, logins });

        const authStore = createAuthStore(createMemoryStore());
        authStore.setOfflineKD(offline.offlineKD);
        const decrypted = await decryptCache((await getCacheKey(cache.encrypted, authStore))!, cache.encrypted);

        return { cryptoUser, decrypted, ...cache };
    };

    test('decrypts through the offline key, without the key password', async () => {
        const { vault, items, decrypted } = await setup();

        expect(decrypted?.state.shares[vault.shareId]).toEqual(vault);
        const cachedLogin = decrypted?.state.items.byShareId[vault.shareId][items[0].itemId];
        expect(deobfuscateItem(cachedLogin!.data).content).toMatchObject({ password: 'bank-pass' });
        expect(decrypted?.snapshot.shareManagers.map(([shareId]) => shareId)).toEqual([vault.shareId]);
    });

    test('rehydrates `PassCrypto` from the snapshot', async () => {
        const { cryptoUser, vault, decrypted } = await setup();

        PassCrypto.clear();
        await PassCrypto.hydrate({
            user: cryptoUser.user,
            addresses: [cryptoUser.address],
            keyPassword: cryptoUser.keyPassword,
            snapshot: decrypted!.snapshot,
        });

        expect(PassCrypto.getShareManager(vault.shareId).hasVaultShareKey(1)).toBe(true);
    });
});
