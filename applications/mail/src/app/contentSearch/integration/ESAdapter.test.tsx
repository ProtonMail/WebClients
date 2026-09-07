import type { ESCallbacks, NormalizedSearchParams } from '@proton/encrypted-search/models';

import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch';
import type { SearchService } from '../search/SearchService';
import { ESAdapter } from './ESAdapter';
import { fakeImportHandle, fakeIndexService, fakeV1Functions, flushPromises } from './testFakes';

const esCallbacks = {
    getSearchParams: () => ({ isSearch: true, esSearchParams: { normalizedKeywords: ['hello'] } }),
    getKeywords: () => ['hello'],
} as unknown as ESCallbacks<ESBaseMessage, NormalizedSearchParams, ESMessageContent>;

/** A search that reports no error and ends normally, so `encryptedSearch` reports success. */
const fakeSearchService = () =>
    ({
        warmUp: jest.fn().mockResolvedValue(undefined),
        search: jest.fn(() => ({
            update: () => false,
            dispose: jest.fn(),
            results: undefined,
            onResults: { subscribe: () => () => {} },
            onError: { subscribe: () => () => {} },
            onDisposed: { subscribe: () => () => {} },
            done: Promise.resolve('completed'),
        })),
    }) as unknown as SearchService;

const setup = ({ withImport = true }: { withImport?: boolean } = {}) => {
    const v1 = fakeV1Functions();
    const importRun = fakeImportHandle();
    const adapter = new ESAdapter({
        searchService: fakeSearchService(),
        indexService: fakeIndexService(withImport ? importRun.handle : undefined),
        esCallbacks,
        esLibraryFunctionsV1: v1.functions,
        updateESStatus: jest.fn(),
        updateESProgress: jest.fn(),
    });
    adapter.isActive = true;
    return { adapter, v1, importRun };
};

/** Runs `initializeES` and reports whether it has resolved, without awaiting it. */
const startInitialize = (adapter: ESAdapter) => {
    const state = { resolved: false, rejected: undefined as unknown };
    const promise = adapter.initializeES().then(
        () => {
            state.resolved = true;
        },
        (error) => {
            state.rejected = error;
        }
    );
    return { state, settled: promise };
};

describe('ESAdapter', () => {
    describe('initializeES', () => {
        it('should not wait when v1 has no content index to import from', async () => {
            const { adapter, v1 } = setup();

            const { state, settled } = startInitialize(adapter);
            v1.settle({ contentIndexingDone: false });
            await settled;

            expect(state.resolved).toBe(true);
        });

        // The branches that return without concluding anything - no database, a corrupt one - have
        // nothing for us to import from either.
        it('should not wait when v1 reports nothing at all', async () => {
            const { adapter, v1 } = setup();

            const { state, settled } = startInitialize(adapter);
            v1.end();
            await settled;

            expect(state.resolved).toBe(true);
        });

        it('should wait for the startup import before reporting ready', async () => {
            const { adapter, v1, importRun } = setup();

            const { state, settled } = startInitialize(adapter);
            v1.settle();
            await flushPromises();
            expect(state.resolved).toBe(false);

            importRun.end('completed');
            await settled;
            expect(state.resolved).toBe(true);
        });

        it('should answer searches from the index once the import has completed', async () => {
            const { adapter, v1, importRun } = setup();

            const { settled } = startInitialize(adapter);
            v1.settle();
            await flushPromises();
            importRun.end('completed');
            await settled;

            await expect(adapter.encryptedSearch(jest.fn())).resolves.toBe(true);
        });

        // A failed import leaves the v2 index partial. Searches have to be released anyway - waiting
        // forever is worse - but they go to the server rather than to a half-filled index.
        it('should report ready when the import fails, and send searches to the server', async () => {
            const { adapter, v1, importRun } = setup();

            const { state, settled } = startInitialize(adapter);
            v1.settle();
            await flushPromises();
            importRun.end('failed');
            await settled;

            expect(state.resolved).toBe(true);
            await expect(adapter.encryptedSearch(jest.fn())).resolves.toBe(false);
        });

        it('should report ready when the job is torn down before the import ends', async () => {
            const { adapter, v1 } = setup();

            const { state, settled } = startInitialize(adapter);
            v1.settle();
            await flushPromises();
            expect(state.resolved).toBe(false);

            await adapter.esDelete();
            await settled;
            expect(state.resolved).toBe(true);
        });

        it('should fail when v1 startup fails', async () => {
            const { adapter, v1 } = setup();

            const { state, settled } = startInitialize(adapter);
            v1.fail(new Error('startup blew up'));
            await settled;

            expect(state.rejected).toEqual(new Error('startup blew up'));
        });
    });
});
