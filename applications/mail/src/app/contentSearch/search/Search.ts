import type * as Comlink from 'comlink';
import isDeepEqual from 'lodash/isEqual';

import type { ESItem, NormalizedSearchParams } from '@proton/encrypted-search/models';
import createListeners from '@proton/shared/lib/helpers/listeners.ts';

import type { ESBaseMessage, ESMessageContent } from 'proton-mail/models/encryptedSearch.ts';

import type { EncryptedSearchReader } from '../import/EncryptedSearchReader';
import type SearchWorker from './SearchWorker';

type SearchResult = ESItem<ESBaseMessage, ESMessageContent>;

/** represents a single search */
export class Search {
    public readonly onResults = createListeners<[SearchResult[]]>();
    public readonly onError = createListeners<[Error]>();
    public readonly onDisposed = createListeners<[]>();

    private unfilteredResults?: SearchResult[];
    private filteredResults?: SearchResult[];

    constructor(
        private params: NormalizedSearchParams,
        private workerPromise: Promise<Comlink.Remote<SearchWorker> | undefined>,
        private openESReader: () => Promise<EncryptedSearchReader>
    ) {}

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
        this.execute().catch((err) => {
            this.onError.notify(err as Error);
        });
    }

    /**
     * Run a search against the content-search-v2 index and return the matching messages
     * as elements, ready to be handed to the encrypted-search results callback. The hit
     * ids are resolved into renderable metadata via the legacy encrypted-search store,
     * which V2 seeds from and therefore always exists alongside it.
     */
    private async execute(): Promise<void> {
        const worker = await this.workerPromise;
        // index does not exist yet, for now just show empty results
        if (!worker) {
            this.unfilteredResults = [];
            this.applyFilters();
            return;
        }
        performance.mark('search-worker-start');
        const ids = await worker.search(this.params);
        performance.measure('search-worker', 'search-worker-start');
        if (ids.length === 0) {
            this.unfilteredResults = [];
        } else {
            const oldStore = await this.openESReader();
            try {
                performance.mark('search-read-messages-start');
                this.unfilteredResults = await oldStore.readMessages(ids);
                performance.measure('search-read-messages', 'search-read-messages-start');
            } finally {
                oldStore.close();
            }
        }
        this.applyFilters();
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
