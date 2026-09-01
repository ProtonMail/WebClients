import * as Comlink from 'comlink';
import isDeepEqual from 'lodash/isEqual';

import type { ESItem, NormalizedSearchParams } from '@proton/encrypted-search/models';
import createListeners from '@proton/shared/lib/helpers/listeners.ts';

import type { ESBaseMessage, ESMessageContent } from '../../models/encryptedSearch.ts';
import type { DatabaseLock } from '../db/DatabaseLock';
import type { EncryptedSearchReader } from '../import/EncryptedSearchReader';
import type { Logger } from '../utils/logger.ts';
import type SearchWorker from './SearchWorker';

type SearchResult = ESItem<ESBaseMessage, ESMessageContent>;

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

    private unfilteredResults?: SearchResult[];
    private filteredResults?: SearchResult[];
    private resolveDone?: (outcome: SearchOutcome) => void;

    constructor(
        private params: NormalizedSearchParams,
        private dbLock: DatabaseLock,
        private workerPromise: Promise<Comlink.Remote<SearchWorker> | undefined>,
        private readonly logger: Logger,
        private openESReader: () => Promise<EncryptedSearchReader | undefined>
    ) {
        this.done = new Promise((resolve) => {
            this.resolveDone = resolve;
        });
    }

    containsMessage(id: string): boolean {
        return !!this.filteredResults?.some((m) => m.ID === id);
    }

    update(params: NormalizedSearchParams): boolean {
        // We apply the Unread filter in memory rather than re-running the query, so an update that
        // only toggles Unread can be absorbed without a new search. Compare non-mutating copies with
        // Unread normalized on both sides, so a missing key and a present-but-undefined key don't
        // read as a difference (lodash isEqual treats { Unread: undefined } and {} as unequal).
        const equalApartFromUnread = isDeepEqual(
            { ...this.params, filter: { ...this.params.filter, Unread: undefined } },
            { ...params, filter: { ...params.filter, Unread: undefined } }
        );
        if (equalApartFromUnread) {
            const oldUnread = this.params.filter.Unread;
            this.params = params;
            if (oldUnread !== this.params.filter.Unread) {
                this.applyFilters();
            }
            return true;
        }
        return false;
    }

    get results(): SearchResult[] | undefined {
        return this.filteredResults;
    }

    /** @internal called by SearchService */
    public start() {
        this.execute()
            .then((outcome) => {
                this.resolveDone?.(outcome);
            })
            .catch((err) => {
                this.resolveDone?.('failed');
                this.onError.notify(err as Error);
            });
    }

    /**
     * Run a search against the content-search-v2 index and return the matching messages
     * as elements, ready to be handed to the encrypted-search results callback. The hit
     * ids are resolved into renderable metadata via the legacy encrypted-search store,
     * which V2 seeds from and therefore always exists alongside it.
     */
    private async execute(): Promise<SearchOutcome> {
        const promises: Promise<void>[] = [];

        const worker = await this.workerPromise;
        // The index doesn't exist yet. Report that rather than notifying an empty result set: no
        // results were *found*, the query simply never ran, and only the caller can decide where to
        // send it instead.
        if (!worker) {
            return 'no-index';
        }

        // Open the legacy store only once we know the v2 index exists (the reader never creates the v1
        // DB — see EncryptedSearchReader.open). If it's somehow missing there's nothing to resolve.
        const oldStore = await this.openESReader();
        if (!oldStore) {
            return 'no-index';
        }

        const fetchMessagesForIDs = async (ids: string[]) => {
            const storeMessages = await oldStore.readMessages(ids);
            this.unfilteredResults = this.unfilteredResults
                ? this.unfilteredResults.concat(storeMessages)
                : storeMessages;
            this.applyFilters();
        };

        try {
            performance.mark('search-worker-start');
            await this.dbLock.runSearch(() =>
                worker.search(
                    this.params,
                    Comlink.proxy((ids) => {
                        promises.push(fetchMessagesForIDs(ids));
                    })
                )
            );
            await Promise.all(promises);
            this.logger.info(`ran search with ${this.unfilteredResults?.length} results`);
        } finally {
            oldStore.close();
        }
        return 'completed';
    }

    private applyFilters() {
        if (this.unfilteredResults === undefined) {
            return;
        }
        // We don't index Unread, as it changes too often.
        // Instead, we apply the filter in memory.
        const { Unread } = this.params.filter;
        if (Unread !== undefined) {
            this.filteredResults = this.unfilteredResults.filter((message) => {
                return message.Unread === Unread;
            });
        } else {
            this.filteredResults = this.unfilteredResults;
        }
        this.onResults.notify(this.filteredResults);
    }

    /** disposes of all search related resources.
     * after this, none of the event (onResults, onError, onDisposed) callbacks will be called anymore */
    dispose() {
        // TODO: cancel ongoing search, if any
        this.onDisposed.notify();
        this.onDisposed.clear();
        this.onResults.clear();
        this.onError.clear();
    }
}
