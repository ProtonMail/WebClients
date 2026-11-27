import type * as Comlink from 'comlink';

import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';

import { TabLocalDatabaseLock } from '../coordination/TabLocalDatabaseLock';
import { openContentSearchDB } from '../db/open';
import type { MessageCacheEntry } from '../indexation/MessageCache';
import type { ExpressionUpdates, ExpressionUpdatesListener } from '../indexation/OpenSearchSubscriptions';
import { LoggerProxy } from '../utils/logger';
import { Search } from './Search';
import type SearchWorker from './SearchWorker';

type SearchResult = MessageCacheEntry;

const userId = 'user1';

// Search opens the DB itself and builds a MessageCache on it to resolve the hit ids, so both are
// stubbed here: no IndexedDB, no crypto.
const openDBMock = vi.mocked(openContentSearchDB);
const messageCacheMock = { readMessages: vi.fn() };
vi.mock('../db/open', () => ({ openContentSearchDB: vi.fn() }));
vi.mock('../indexation/MessageCache', () => ({
    MessageCache: vi.fn().mockImplementation(function () {
        return messageCacheMock;
    }),
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
    const workerSearch = vi.fn(async (params, callback) => {
        const ids = messages.map((m) => m.ID);
        await callback(ids);
    });
    const worker = { search: workerSearch } as unknown as Comlink.Remote<SearchWorker>;
    messageCacheMock.readMessages.mockImplementation(
        async (ids: string[]) => new Map(ids.map((id) => [id, messages.find((m) => m.ID === id)]))
    );
    const close = vi.fn();
    openDBMock.mockResolvedValue({ close } as unknown as Awaited<ReturnType<typeof openContentSearchDB>>);

    const deps = Promise.resolve({
        worker,
        indexKey: {} as CryptoKey,
        useV2Indexing: true,
        userKeys: undefined,
    });

    const search = new Search(initial, new TabLocalDatabaseLock(), deps, userId, new LoggerProxy(undefined));
    const onResults = vi.fn();

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

describe('Search.canServe', () => {
    const unread = message('unread', 1);
    const read = message('read', 0);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns true and does not re-run the search when the new params are identical', async () => {
        const { search, onResults, workerSearch } = await startedSearch(params(), [unread, read]);
        onResults.mockClear();

        expect(search.canServe(params())).toBe(true);
        // the Unread filter did not change, so the in-memory results are left untouched
        expect(onResults).not.toHaveBeenCalled();
        // and no second worker round-trip: canServe never re-executes the query
        expect(workerSearch).toHaveBeenCalledTimes(1);
    });

    it('returns false when a non-Unread field differs', async () => {
        const { search, onResults } = await startedSearch(params(), [unread, read]);
        onResults.mockClear();

        expect(search.canServe(params({ search: { keyword: 'different' } as any }))).toBe(false);
        expect(onResults).not.toHaveBeenCalled();
    });

    it('keeps the same results when only Unread changes', async () => {
        // start with "unread only", switch to "read only"
        const { search, onResults, workerSearch } = await startedSearch(params({ filter: { Unread: 1 } }), [
            unread,
            read,
        ]);
        onResults.mockClear();

        expect(search.canServe(params({ filter: { Unread: 0 } }))).toBe(true);

        // the element list applies the Unread filter itself, so neither a new query nor new results
        expect(workerSearch).toHaveBeenCalledTimes(1);
        expect(onResults).not.toHaveBeenCalled();
        expect(search.containsMessage('read')).toBe(true);
        expect(search.containsMessage('unread')).toBe(true);
    });

    it('does not filter results on Unread', async () => {
        const { search } = await startedSearch(params({ filter: { Unread: 1 } }), [unread, read]);

        expect(search.results).toEqual([unread, read]);
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
        const onResults = vi.fn();
        search.onResults.subscribe(onResults);

        expect(search.canServe(params({ filter: { Unread: 0 } }))).toBe(true);
        expect(onResults).not.toHaveBeenCalled();
    });

    // Regression guard: the no-unread-filter shape (produced when no unread filter is active) has no
    // Unread key at all. canServe() must still treat two such identical params as equal, even though
    // lodash isEqual treats { Unread: undefined } and {} as unequal.
    it('returns true for identical params when neither carries an Unread key', async () => {
        const noUnread = () => params({ filter: {} });
        const { search, onResults, workerSearch } = await startedSearch(noUnread(), [unread, read]);
        onResults.mockClear();

        expect(search.canServe(noUnread())).toBe(true);
        expect(onResults).not.toHaveBeenCalled();
        expect(workerSearch).toHaveBeenCalledTimes(1);
    });
});

describe('Search results order', () => {
    const timed = (ID: string, Time: number, Order = 0) =>
        ({ ID, Unread: 1, Time, Order, ConversationID: `conversation-${ID}` }) as unknown as SearchResult;
    const ids = (results: SearchResult[]) => results.map(({ ID }) => ID);

    it('sorts the results most recent first', async () => {
        const { search } = await startedSearch(params({ filter: {} }), [timed('a', 1), timed('c', 3), timed('b', 2)]);

        expect(ids(search.results!)).toEqual(['c', 'b', 'a']);
    });

    it('sorts the results oldest first for an ascending sort', async () => {
        const { search } = await startedSearch(params({ filter: {}, sort: { sort: 'Time', desc: false } }), [
            timed('b', 2),
            timed('a', 1),
            timed('c', 3),
        ]);

        expect(ids(search.results!)).toEqual(['a', 'b', 'c']);
    });

    it('breaks ties on Order', async () => {
        const { search } = await startedSearch(params({ filter: {} }), [timed('first', 1, 1), timed('second', 1, 2)]);

        expect(ids(search.results!)).toEqual(['second', 'first']);
    });
});

describe('Search updates', () => {
    const timed = (ID: string, Time: number, Subject = '') =>
        ({ ID, Unread: 1, Time, Order: 0, Subject, ConversationID: `conversation-${ID}` }) as unknown as SearchResult;
    const ids = (results: SearchResult[] | undefined) => (results ?? []).map(({ ID }) => ID);

    /**
     * A search whose worker finds `initial`, with `cache` as the message cache, that holds the listener it
     * subscribes with. The initial search only completes once `finishInitialSearch` is called.
     */
    const searchWithUpdates = (
        initial: SearchResult[],
        cache: Map<string, SearchResult>,
        { subscribeFails = false }: { subscribeFails?: boolean } = {}
    ) => {
        let finishInitialSearch = () => {};
        const initialSearchFinished = new Promise<void>((resolve) => {
            finishInitialSearch = resolve;
        });
        const order: string[] = [];
        /** what the index holds: the ids the worker finds */
        const index = { ids: ids(initial) };
        const workerSearch = vi.fn(async (_params, callback) => {
            order.push('search');
            await callback(index.ids);
            await initialSearchFinished;
        });
        const worker = {
            search: workerSearch,
            getExpression: vi.fn(async () => {
                return 'hello';
            }),
        } as unknown as Comlink.Remote<SearchWorker>;
        messageCacheMock.readMessages.mockImplementation(async (requested: string[]) => {
            return new Map(
                requested.flatMap((id) => {
                    const message = cache.get(id);
                    return message ? [[id, message]] : [];
                })
            );
        });
        openDBMock.mockResolvedValue({ close: vi.fn() } as unknown as Awaited<ReturnType<typeof openContentSearchDB>>);
        const unsubscribe = vi.fn();
        let listener: ExpressionUpdatesListener | undefined;
        const subscribe = vi.fn(async (_expression: string, l: ExpressionUpdatesListener) => {
            order.push('subscribe');
            listener = l;
            // the leader sees the search a little later
            await new Promise((resolve) => setTimeout(resolve, 0));
            if (subscribeFails) {
                throw new Error('the lock request was rejected');
            }
            order.push('subscribed');
            return unsubscribe;
        });
        const search = new Search(
            params({ filter: {} }),
            new TabLocalDatabaseLock(),
            Promise.resolve({ worker, indexKey: {} as CryptoKey, useV2Indexing: true, userKeys: undefined }),
            userId,
            new LoggerProxy(undefined),
            subscribe
        );
        const onResults = vi.fn();
        search.onResults.subscribe(onResults);
        search.start();
        const update = (updates: Partial<ExpressionUpdates>) => {
            listener!.onUpdates({ matched: [], unmatched: [], removed: [], ...updates });
        };
        const reportMissedUpdates = () => {
            listener!.onMissedUpdates();
        };
        return {
            search,
            onResults,
            subscribe,
            unsubscribe,
            update,
            reportMissedUpdates,
            finishInitialSearch,
            order,
            cache,
            index,
            workerSearch,
        };
    };

    const settle = () => {
        return new Promise((resolve) => setTimeout(resolve, 0));
    };

    /** the message cache holds the initial results, the test changes it as the index would */
    const started = async (initial: SearchResult[]) => {
        const setup = searchWithUpdates(initial, new Map(initial.map((m) => [m.ID, m])));
        setup.finishInitialSearch();
        await setup.search.done;
        return setup;
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('still runs, without updates, when it cannot subscribe', async () => {
        const { search, finishInitialSearch, order } = searchWithUpdates(
            [timed('a', 1)],
            new Map([['a', timed('a', 1)]]),
            { subscribeFails: true }
        );
        finishInitialSearch();

        expect(await search.done).toBe('completed');
        expect(ids(search.results)).toEqual(['a']);
        expect(order).toEqual(['subscribe', 'search']);
    });

    it('runs the initial search only once the leader sees its expression', async () => {
        const { subscribe, order } = await started([timed('a', 1)]);

        expect(subscribe).toHaveBeenCalledWith('hello', expect.any(Object));
        expect(order).toEqual(['subscribe', 'subscribed', 'search']);
    });

    it('applies the updates received during the initial search once it is done', async () => {
        const { search, update, finishInitialSearch } = searchWithUpdates(
            [timed('a', 1), timed('b', 2)],
            new Map([
                ['a', timed('a', 1)],
                ['b', timed('b', 2)],
                ['c', timed('c', 3)],
            ])
        );
        await settle();

        update({ removed: ['a'] });
        update({ matched: ['c'] });
        await settle();
        expect(ids(search.results)).toEqual(['b', 'a']);

        finishInitialSearch();
        await search.done;
        await settle();
        expect(ids(search.results)).toEqual(['c', 'b']);
    });

    it('drops a deleted result', async () => {
        const { search, update, onResults } = await started([timed('a', 1), timed('b', 2)]);
        onResults.mockClear();

        update({ removed: ['a', 'not-a-result'] });
        await settle();

        expect(ids(search.results)).toEqual(['b']);
        expect(onResults).toHaveBeenCalledTimes(1);
        expect(search.containsMessage('a')).toBe(false);
    });

    it('drops a result that does not match anymore, and ignores what never matched', async () => {
        const { search, update } = await started([timed('a', 1), timed('b', 2)]);

        update({ unmatched: ['a', 'never-matched'] });
        await settle();

        expect(ids(search.results)).toEqual(['b']);
    });

    it('adds a new match where it sorts', async () => {
        const { search, update, cache } = await started([timed('a', 1), timed('c', 3)]);
        cache.set('b', timed('b', 2));

        update({ matched: ['b'] });
        await settle();

        expect(ids(search.results)).toEqual(['c', 'b', 'a']);
    });

    it('replaces an updated result, and keeps its copy when the cache misses it', async () => {
        const { search, update, cache } = await started([timed('a', 1, 'old subject'), timed('b', 2)]);
        cache.set('a', timed('a', 1, 'updated subject'));
        cache.delete('b');

        update({ matched: ['a', 'b'] });
        await settle();

        expect(search.results).toEqual([timed('b', 2), timed('a', 1, 'updated subject')]);
    });

    it('does not notify for an update that changes nothing', async () => {
        const { update, onResults } = await started([timed('a', 1)]);
        onResults.mockClear();

        update({ unmatched: ['never-matched'], removed: [] });
        await settle();

        expect(onResults).not.toHaveBeenCalled();
    });

    it('unsubscribes once disposed, and applies nothing after', async () => {
        const { search, update, unsubscribe, onResults } = await started([timed('a', 1)]);
        onResults.mockClear();

        search.dispose();
        update({ removed: ['a'] });
        await settle();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
        expect(ids(search.results)).toEqual(['a']);
        expect(onResults).not.toHaveBeenCalled();
    });

    it('unsubscribes at once when disposed while subscribing', async () => {
        const { search, unsubscribe, finishInitialSearch } = searchWithUpdates([], new Map());
        await new Promise((resolve) => setTimeout(resolve, 0));

        search.dispose();
        finishInitialSearch();
        await search.done;
        await settle();

        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('does not subscribe when disposed before it got its expression', async () => {
        const { search, subscribe, finishInitialSearch } = searchWithUpdates([], new Map());

        search.dispose();
        finishInitialSearch();
        await search.done;

        expect(subscribe).not.toHaveBeenCalled();
    });

    describe('when it may have missed updates', () => {
        it('runs again and replaces its results with what the index holds now', async () => {
            const { search, reportMissedUpdates, index, cache, workerSearch, onResults } = await started([
                timed('a', 1),
                timed('b', 2),
            ]);
            cache.set('c', timed('c', 3));
            index.ids = ['a', 'c'];
            onResults.mockClear();

            reportMissedUpdates();
            await settle();

            expect(workerSearch).toHaveBeenCalledTimes(2);
            expect(ids(search.results)).toEqual(['c', 'a']);
            expect(onResults).toHaveBeenCalledTimes(1);
        });

        it('runs again once for reports that come in before it started, and applies later updates after it', async () => {
            const { search, reportMissedUpdates, update, index, cache, workerSearch } = await started([timed('a', 1)]);
            cache.set('b', timed('b', 2));
            cache.set('c', timed('c', 3));
            index.ids = ['a', 'b'];

            reportMissedUpdates();
            reportMissedUpdates();
            update({ matched: ['c'] });
            await settle();
            await settle();

            expect(workerSearch).toHaveBeenCalledTimes(2);
            expect(ids(search.results)).toEqual(['c', 'b', 'a']);
        });

        it('does not run again once disposed', async () => {
            const { search, reportMissedUpdates, workerSearch } = await started([timed('a', 1)]);

            search.dispose();
            reportMissedUpdates();
            await settle();

            expect(workerSearch).toHaveBeenCalledTimes(1);
        });
    });
});
