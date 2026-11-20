import type * as Comlink from 'comlink';

import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';

import { TabLocalDatabaseLock } from '../coordination/TabLocalDatabaseLock';
import { openContentSearchDB } from '../db/open';
import type { MessageCacheEntry } from '../indexation/MessageCache';
import { LoggerProxy } from '../utils/logger';
import { Search } from './Search';
import type SearchWorker from './SearchWorker';

type SearchResult = MessageCacheEntry;

const userId = 'user1';

// Search opens the DB itself and builds a MessageCache on it to resolve the hit ids, so both are
// stubbed here: no IndexedDB, no crypto.
const openDBMock = jest.mocked(openContentSearchDB);
const messageCacheMock = { readMessages: jest.fn() };
jest.mock('../db/open', () => ({ openContentSearchDB: jest.fn() }));
jest.mock('../indexation/MessageCache', () => ({
    MessageCache: jest.fn().mockImplementation(() => messageCacheMock),
}));

const params = (over: Partial<NormalizedSearchParams> = {}): NormalizedSearchParams =>
    ({
        labelIDs: [],
        sort: { sort: 'Time', desc: true },
        filter: { Unread: 1 },
        search: { keyword: 'hello' },
        normalizedKeywords: undefined,
        ...over,
    }) as unknown as NormalizedSearchParams;

const message = (ID: string, Unread: number): SearchResult => ({ ID, Unread }) as unknown as SearchResult;

/**
 * Builds a Search whose worker returns `ids` and whose message cache resolves those ids into
 * `messages`, then runs the initial search so the filtered results are populated by the time it
 * resolves.
 */
const startedSearch = async (initial: NormalizedSearchParams, messages: SearchResult[]) => {
    const workerSearch = jest.fn(async (params, callback) => {
        const ids = messages.map((m) => m.ID);
        await callback(ids);
    });
    const worker = { search: workerSearch } as unknown as Comlink.Remote<SearchWorker>;
    messageCacheMock.readMessages.mockImplementation(
        async (ids: string[]) => new Map(ids.map((id) => [id, messages.find((m) => m.ID === id)]))
    );
    const close = jest.fn();
    openDBMock.mockResolvedValue({ close } as unknown as Awaited<ReturnType<typeof openContentSearchDB>>);

    const deps = Promise.resolve({
        worker,
        indexKey: {} as CryptoKey,
        useV2Indexing: true,
        userKeys: undefined,
    });

    const search = new Search(initial, new TabLocalDatabaseLock(), deps, userId, new LoggerProxy(undefined));
    const onResults = jest.fn();

    search.onResults.subscribe(onResults);

    const firstResults = new Promise<SearchResult[]>((resolve, reject) => {
        const unsubscribe = search.onResults.subscribe((results) => {
            unsubscribe();
            resolve(results);
        });
        search.onError.subscribe(reject);
        void search.done.then((outcome) => {
            if (outcome !== 'completed') {
                reject(new Error(`search ended with ${outcome}`));
            }
        });
    });
    search.start();
    await firstResults;

    return { search, onResults, workerSearch, readMessages: messageCacheMock.readMessages };
};

describe('Search.update', () => {
    const unread = message('unread', 1);
    const read = message('read', 0);

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns true and does not re-run the search when the new params are identical', async () => {
        const { search, onResults, workerSearch } = await startedSearch(params(), [unread, read]);
        onResults.mockClear();

        expect(search.update(params())).toBe(true);
        // the Unread filter did not change, so the in-memory results are left untouched
        expect(onResults).not.toHaveBeenCalled();
        // and no second worker round-trip: update never re-executes the query
        expect(workerSearch).toHaveBeenCalledTimes(1);
    });

    it('returns false when a non-Unread field differs', async () => {
        const { search, onResults } = await startedSearch(params(), [unread, read]);
        onResults.mockClear();

        expect(search.update(params({ search: { keyword: 'different' } as any }))).toBe(false);
        expect(onResults).not.toHaveBeenCalled();
    });

    it('re-applies the Unread filter in memory when only Unread changes', async () => {
        // start with "unread only", switch to "read only"
        const { search, onResults, workerSearch } = await startedSearch(params({ filter: { Unread: 1 } }), [
            unread,
            read,
        ]);
        onResults.mockClear();

        expect(search.update(params({ filter: { Unread: 0 } }))).toBe(true);

        // narrowed to the read message, without going back to the worker
        expect(workerSearch).toHaveBeenCalledTimes(1);
        expect(onResults).toHaveBeenCalledTimes(1);
        expect(onResults).toHaveBeenCalledWith([read]);
        expect(search.containsMessage('read')).toBe(true);
        expect(search.containsMessage('unread')).toBe(false);
    });

    it('returns true without notifying when results have not loaded yet', () => {
        // worker promise never resolves, so execute() never populates unfilteredResults
        const search = new Search(
            params({ filter: { Unread: 1 } }),
            new TabLocalDatabaseLock(),
            new Promise(() => {}),
            userId,
            new LoggerProxy(undefined)
        );
        const onResults = jest.fn();
        search.onResults.subscribe(onResults);

        expect(search.update(params({ filter: { Unread: 0 } }))).toBe(true);
        expect(onResults).not.toHaveBeenCalled();
    });

    // Regression guard: the no-unread-filter shape (produced when no unread filter is active) has no
    // Unread key at all. update() must still treat two such identical params as equal, even though
    // lodash isEqual treats { Unread: undefined } and {} as unequal.
    it('returns true for identical params when neither carries an Unread key', async () => {
        const noUnread = () => params({ filter: {} });
        const { search, onResults, workerSearch } = await startedSearch(noUnread(), [unread, read]);
        onResults.mockClear();

        expect(search.update(noUnread())).toBe(true);
        expect(onResults).not.toHaveBeenCalled();
        expect(workerSearch).toHaveBeenCalledTimes(1);
    });
});
