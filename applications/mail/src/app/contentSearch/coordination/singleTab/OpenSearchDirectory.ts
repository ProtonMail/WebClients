import type { OpenSearchDirectory as OpenSearchDirectoryInterface } from '../OpenSearchDirectory';

/**
 * {@link OpenSearchDirectoryInterface} for a tab that works alone: it leads itself and indexes every event, so its own
 * searches are all its indexer needs to match. Never misses updates, as nothing is shared with other tabs.
 */
export class OpenSearchDirectory implements OpenSearchDirectoryInterface {
    private readonly searches = new Map<string, string>();

    async open(searchId: string, expression: string, _onMissedUpdates: () => void): Promise<() => void> {
        this.searches.set(searchId, expression);
        return () => {
            this.searches.delete(searchId);
        };
    }

    async list(): Promise<ReadonlyMap<string, string>> {
        return new Map(this.searches);
    }
}
