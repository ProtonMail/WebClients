import * as Comlink from 'comlink';
import type { IDBPDatabase } from 'idb';
import isDeepEqual from 'lodash/isEqual';

import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';
import createListeners from '@proton/shared/lib/helpers/listeners';
import type { DecryptedKey } from '@proton/shared/lib/interfaces/Key';

import { sort as sortElements } from '../../helpers/elements';
import type { DatabaseLock } from '../db/DatabaseLock';
import { openContentSearchDB } from '../db/open.ts';
import type { Database } from '../db/schema.ts';
import { EncryptedSearchReader } from '../import/EncryptedSearchReader.ts';
import { MessageCache, type MessageCacheEntry } from '../indexation/MessageCache.ts';
import type { ExpressionUpdates, ExpressionUpdatesListener } from '../indexation/OpenSearchSubscriptions.ts';
import type { Logger } from '../utils/logger.ts';
import type SearchWorker from './SearchWorker';

interface SearchMessageCache {
    readMessages(ids: string[], db: IDBPDatabase<Database>): Promise<Map<string, MessageCacheEntry>>;
    close(): void;
}

class V2MessageCache implements SearchMessageCache {
    constructor(private readonly messageCache: MessageCache) {}

    readMessages(ids: string[], db: IDBPDatabase<Database>): Promise<Map<string, MessageCacheEntry>> {
        return this.messageCache.readMessages(ids, db);
    }

    close() {}
}

class V1MessageCache implements SearchMessageCache {
    constructor(private readonly encryptedReader: EncryptedSearchReader) {}

    async readMessages(ids: string[]): Promise<Map<string, MessageCacheEntry>> {
        const messages = await this.encryptedReader.readMessages(ids);
        const messagesWithBody = messages.filter((m) => m.decryptedBody !== undefined);
        return new Map(
            messagesWithBody.map((m) => {
                return [m.ID, m as MessageCacheEntry];
            })
        );
    }

    close() {
        this.encryptedReader.close();
    }
}

type SearchResult = MessageCacheEntry;

/** see `IndexService.subscribeToExpressionUpdates` */
export type SubscribeToExpressionUpdates = (
    expression: string,
    listener: ExpressionUpdatesListener
) => Promise<() => void>;

/** what an update does to the results of a search */
interface ResultChanges {
    /** matched, and not among the results yet */
    added: string[];
    /** matched, and among the results already */
    updated: string[];
    /** deleted, or among the results and not matched anymore */
    removed: string[];
}

const classifyUpdates = (
    { matched, unmatched, removed }: ExpressionUpdates,
    isResult: (id: string) => boolean
): ResultChanges => {
    return {
        added: matched.filter((id) => {
            return !isResult(id);
        }),
        updated: matched.filter(isResult),
        removed: [...removed, ...unmatched.filter(isResult)],
    };
};

/**
 * How a search ended. `no-index` means the query never ran because there was nothing to run it
 * against, which is not the same as finding no matches: the caller has to send the query elsewhere
 * (the server) rather than present an empty result set.
 */
export type SearchOutcome = 'completed' | 'no-index' | 'failed';

/** represents a single search */
export class Search {
    public readonly onResults = createListeners<[SearchResult[]]>();
    public readonly onError = createListeners<[Error]>();
    public readonly onDisposed = createListeners<[]>();
    public readonly done: Promise<SearchOutcome>;

    /** Every result found so far, in the order they came in */
    private foundResults?: SearchResult[];
    /** `foundResults`, sorted */
    private sortedResults?: SearchResult[];
    private resolveDone?: (outcome: SearchOutcome) => void;
    private disposed = false;
    private unsubscribeFromUpdates?: () => void;
    /**
     * Updates apply one after the other, from once the initial search is done: until then, they wait their turn.
     */
    private updates: Promise<void>;
    private resolveInitialSearchDone?: () => void;
    /** a run again is queued and hasn't started: another missed-updates report has nothing to add */
    private runAgainQueued = false;
    /** how updates read the messages they add or update */
    private updatesMessageCache?: SearchMessageCache;

    constructor(
        private readonly params: NormalizedSearchParams,
        private dbLock: DatabaseLock,
        private workerPromise: Promise<
            | {
                  worker: Comlink.Remote<SearchWorker>;
                  indexKey: CryptoKey;
                  useV2Indexing: boolean;
                  userKeys: DecryptedKey[] | undefined;
              }
            | undefined
        >,
        private readonly userId: string,
        private readonly logger: Logger,
        /** keeps the results up to date as the index changes, only given when this session indexes */
        private readonly subscribeToExpressionUpdates?: SubscribeToExpressionUpdates
    ) {
        this.done = new Promise((resolve) => {
            this.resolveDone = resolve;
        });
        this.updates = new Promise((resolve) => {
            this.resolveInitialSearchDone = resolve;
        });
    }

    containsMessage(id: string): boolean {
        return !!this.sortedResults?.some((m) => m.ID === id);
    }

    /**
     * Whether this search's results can serve a list with `params` instead of running a new search. Unread isn't part
     * of the query (it isn't indexed, as it changes too often): the element list applies the Unread filter on the
     * results itself, against up to date read statuses, so params that only differ in Unread are served by the same
     * results. Compare non-mutating copies with Unread normalized on both sides, so a missing key and a
     * present-but-undefined key don't read as a difference (lodash isEqual treats { Unread: undefined } and {} as unequal).
     */
    canServe(params: NormalizedSearchParams): boolean {
        return isDeepEqual(
            { ...this.params, filter: { ...this.params.filter, Unread: undefined } },
            { ...params, filter: { ...params.filter, Unread: undefined } }
        );
    }

    get results(): SearchResult[] | undefined {
        return this.sortedResults;
    }

    /** @internal called by SearchService */
    public start() {
        this.execute()
            .then((outcome) => {
                this.resolveDone?.(outcome);
            })
            .catch((err) => {
                this.onError.notify(err as Error);
                this.resolveDone?.('failed');
            })
            .finally(() => {
                this.resolveInitialSearchDone?.();
            });
    }

    /**
     * Run a search against the content-search-v2 index and return the matching messages
     * as elements, ready to be handed to the encrypted-search results callback. The hit
     * ids are resolved into renderable metadata via the legacy encrypted-search store,
     * which V2 seeds from and therefore always exists alongside it.
     */
    private async execute(): Promise<SearchOutcome> {
        const result = await this.workerPromise;
        // The index doesn't exist yet. Report that rather than notifying an empty result set: no
        // results were *found*, the query simply never ran, and only the caller can decide where to
        // send it instead.
        if (!result) {
            return 'no-index';
        }
        const { worker, indexKey, useV2Indexing, userKeys } = result;

        let messageCache: SearchMessageCache;
        if (useV2Indexing) {
            messageCache = new V2MessageCache(new MessageCache(indexKey));
            // before the search runs, so no index change falls in between
            await this.subscribeToUpdates(worker, messageCache);
        } else {
            const reader = await EncryptedSearchReader.open(this.userId, userKeys!);
            if (reader) {
                messageCache = new V1MessageCache(reader);
            } else {
                return 'no-index';
            }
        }

        try {
            performance.mark('search-worker-start');
            await this.runQuery(worker, messageCache, (foundMessages) => {
                this.foundResults = this.foundResults ? this.foundResults.concat(foundMessages) : foundMessages;
                this.publishResults();
            });
            this.logger.info(`ran search with ${this.foundResults?.length} results`);
        } finally {
            messageCache.close();
        }
        return 'completed';
    }

    /** runs the query in the worker, and hands over the messages it finds as they come in */
    private async runQuery(
        worker: Comlink.Remote<SearchWorker>,
        messageCache: SearchMessageCache,
        onFound: (messages: SearchResult[]) => void
    ) {
        const promises: Promise<void>[] = [];
        const db = await openContentSearchDB(this.userId);
        try {
            const fetchMessagesForIDs = async (ids: string[]) => {
                const storeMessages = await messageCache.readMessages(ids, db);
                onFound(ids.map((id) => storeMessages.get(id)).filter((m) => m !== undefined));
            };
            await this.dbLock.runSearch(() =>
                worker.search(
                    this.params,
                    Comlink.proxy(async (ids) => {
                        promises.push(fetchMessagesForIDs(ids));
                    })
                )
            );
            await Promise.all(promises);
        } finally {
            db.close();
        }
    }

    /**
     * Runs the query again and replaces the results, for when the leader may have stopped seeing this search for a
     * while, so updates may have been missed. Queued like the updates: those that come in meanwhile apply after it.
     */
    private async runAgain(worker: Comlink.Remote<SearchWorker>, messageCache: SearchMessageCache) {
        this.runAgainQueued = false;
        if (this.disposed) {
            return;
        }
        const found: SearchResult[] = [];
        await this.runQuery(worker, messageCache, (messages) => {
            found.push(...messages);
        });
        // a newer search aborts this one in the worker, and replaces it: what it found so far is incomplete
        if (this.disposed) {
            return;
        }
        this.foundResults = found;
        this.publishResults();
        this.logger.info(`ran search again with ${found.length} results, as it may have missed index updates`);
    }

    private async subscribeToUpdates(worker: Comlink.Remote<SearchWorker>, messageCache: SearchMessageCache) {
        if (!this.subscribeToExpressionUpdates) {
            return;
        }
        let expression: string;
        try {
            expression = await worker.getExpression(this.params);
        } catch (err) {
            this.logger.error(
                'failed to get the expression of the search, its results will not be kept up to date',
                err
            );
            return;
        }
        if (this.disposed) {
            return;
        }
        this.updatesMessageCache = messageCache;
        let unsubscribe: () => void;
        try {
            unsubscribe = await this.subscribeToExpressionUpdates(expression, {
                onUpdates: (updates) => {
                    this.queueUpdate(() => {
                        return this.applyUpdates(updates);
                    });
                },
                onMissedUpdates: () => {
                    if (this.runAgainQueued) {
                        return;
                    }
                    this.runAgainQueued = true;
                    this.queueUpdate(() => {
                        return this.runAgain(worker, messageCache);
                    });
                },
            });
        } catch (err) {
            this.logger.error(
                'failed to subscribe the search to index updates, its results will not be kept up to date',
                err
            );
            return;
        }
        if (this.disposed) {
            unsubscribe();
            return;
        }
        this.unsubscribeFromUpdates = unsubscribe;
    }

    /** runs after the initial search and every update queued before */
    private queueUpdate(update: () => Promise<void>) {
        this.updates = this.updates.then(update).catch((err) => {
            this.logger.error('failed to apply an index update to the search results', err);
        });
    }

    private async applyUpdates(updates: ExpressionUpdates) {
        const messageCache = this.updatesMessageCache;
        if (this.disposed || !messageCache) {
            return;
        }
        const resultIds = new Set(
            (this.foundResults ?? []).map(({ ID }) => {
                return ID;
            })
        );
        const { added, updated, removed } = classifyUpdates(updates, (id) => {
            return resultIds.has(id);
        });
        if (added.length + updated.length + removed.length === 0) {
            return;
        }
        const messages = await this.readMessages([...added, ...updated], messageCache);
        if (this.disposed) {
            return;
        }
        const removedIds = new Set(removed);
        const kept = (this.foundResults ?? [])
            .filter(({ ID }) => {
                return !removedIds.has(ID);
            })
            .map((result) => {
                // an updated message the cache misses keeps its previous copy
                return messages.get(result.ID) ?? result;
            });
        const newResults = added.flatMap((id) => {
            const message = messages.get(id);
            return message ? [message] : [];
        });
        this.foundResults = kept.concat(newResults);
        this.publishResults();
    }

    private async readMessages(ids: string[], messageCache: SearchMessageCache) {
        if (ids.length === 0) {
            return new Map<string, SearchResult>();
        }
        const db = await openContentSearchDB(this.userId);
        try {
            return await messageCache.readMessages(ids, db);
        } finally {
            db.close();
        }
    }

    private publishResults() {
        if (this.foundResults === undefined) {
            return;
        }
        // Hits arrive bucket by bucket, in no particular order within a bucket. The element list takes
        // the results as their final order (see `providesOrderedResults`), so sort them here.
        this.sortedResults = sortElements(
            this.foundResults,
            this.params.sort,
            this.params.labelIDs[0] ?? ''
        ) as SearchResult[];
        this.onResults.notify(this.sortedResults);
    }

    /** disposes of all search related resources.
     * after this, none of the event (onResults, onError, onDisposed) callbacks will be called anymore */
    dispose() {
        // TODO: cancel ongoing search, if any
        this.disposed = true;
        this.unsubscribeFromUpdates?.();
        this.unsubscribeFromUpdates = undefined;
        this.onDisposed.notify();
        this.onDisposed.clear();
        this.onResults.clear();
        this.onError.clear();
    }
}
