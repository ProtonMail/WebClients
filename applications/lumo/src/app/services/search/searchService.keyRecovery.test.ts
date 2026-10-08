import { jest } from '@jest/globals';

// Minimal stand-ins for the master key / storage dependencies `getSearchIndexKey` pulls in.
// The only thing under test is the control flow inside `SearchService.getSearchIndexKey`.
// Mocks must be registered with `jest.doMock` + a fresh dynamic `import()` (rather than the
// usual hoisted `jest.mock` + static import) because this test runs under Jest's ESM mode,
// where static imports resolve before `jest.mock` hoisting would otherwise take effect — see
// `lumoBootstrapRecovery.test.ts` for the same pattern.

describe('SearchService.getSearchIndexKey — recovery from an undecryptable stored key (LUMO-853)', () => {
    afterEach(() => jest.resetModules());

    async function loadMockedSearchService(options: { unwrapFails: boolean }) {
        const loadSearchBlob = jest.fn(() => Promise.resolve('U1RBTEU=')); // base64("STALE")
        const saveSearchBlob = jest.fn(() => Promise.resolve(undefined));

        jest.doMock('../../redux/storeRef', () => ({
            getStoreRef: () => ({ getState: () => ({}) }),
        }));
        jest.doMock('../../redux/selectors', () => ({
            selectMasterKeysBundle: () => ({
                primaryMasterKeyId: 'fresh-envelope',
                primaryMasterKey: 'FRESH_MASTER_KEY',
                masterKeys: { 'fresh-envelope': 'FRESH_MASTER_KEY' },
            }),
        }));
        jest.doMock('../../util/masterKeys', () => ({
            buildMasterKeyContext: () => Promise.resolve({ primary: { id: 'primary-wrapping-key' }, legacy: [] }),
        }));
        jest.doMock('../../indexedDb/db', () => ({
            DbApi: jest.fn().mockImplementation(() => ({
                initialize: () => Promise.resolve(undefined),
                loadSearchBlob,
                saveSearchBlob,
                removeSearchBlob: jest.fn(),
            })),
        }));
        jest.doMock('../../crypto', () => ({
            cryptoKeyToBase64: () => Promise.resolve('UNWRAPPED_KEY_BASE64'),
            generateSearchIndexKeyBase64: () => 'RlJFU0g=', // base64("FRESH")
            bytesToAesGcmCryptoKey: () => Promise.resolve({ type: 'AesGcmCryptoKey', encryptKey: {} }),
            unwrapAesKeyWithMasterKeys: () =>
                options.unwrapFails
                    ? Promise.reject(new Error('error while unwrapping aes key: no master key could unwrap this payload'))
                    : Promise.resolve({ key: { type: 'AesGcmCryptoKey', encryptKey: {} }, usedPrimaryMasterKey: true }),
            wrapAesKey: () => Promise.resolve({ toBase64: () => 'WRAPPED_WITH_FRESH_MASTER_KEY' }),
        }));

        const { SearchService } = await import('./searchService');
        return { SearchService, loadSearchBlob, saveSearchBlob };
    }

    it('mints a replacement search index key instead of throwing forever when the stored one cannot be unwrapped', async () => {
        const { SearchService, saveSearchBlob } = await loadMockedSearchService({ unwrapFails: true });

        const service = SearchService.get('lumo-853-user');
        const key = await service.getSearchIndexKey();

        expect(key).toBe('RlJFU0g=');
        expect(saveSearchBlob).toHaveBeenCalledWith('search_index_key', 'WRAPPED_WITH_FRESH_MASTER_KEY');
    });

    it('still unwraps normally (no mint) when a master key can decrypt the stored key', async () => {
        const { SearchService, saveSearchBlob } = await loadMockedSearchService({ unwrapFails: false });

        const service = SearchService.get('lumo-853-user-ok');
        const key = await service.getSearchIndexKey();

        expect(key).toBe('UNWRAPPED_KEY_BASE64');
        expect(saveSearchBlob).not.toHaveBeenCalled();
    });
});
