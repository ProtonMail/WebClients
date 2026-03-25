import type { LatestEventIdProvider } from '@protontech/drive-sdk';

import { SearchDB } from './SearchDB';
import type { TreeEventScopeId } from './types';
import { brandTreeEventScopeId } from './types';

/**
 * Persists event cursor positions to IndexedDB (via SearchDB) so the Drive SDK
 * can resume polling from the correct event ID after a page reload.
 *
 * Opens its own SearchDB connection lazily. IndexedDB handles concurrent
 * connections from main thread and SharedWorker.
 */
export class PersistentLatestEventIdProvider implements LatestEventIdProvider {
    private dbPromise: Promise<SearchDB> | null = null;

    constructor(private readonly userId: string) {}

    private getDb(): Promise<SearchDB> {
        this.dbPromise ??= SearchDB.open(this.userId);
        return this.dbPromise;
    }

    async getLatestEventId(treeEventScopeId: string): Promise<string | null> {
        const db = await this.getDb();
        const sub = await db.getSubscription(brandTreeEventScopeId(treeEventScopeId) as TreeEventScopeId);
        return sub?.lastEventId ?? null;
    }

    async saveLatestEventId(treeEventScopeId: TreeEventScopeId, eventId: string): Promise<void> {
        const db = await this.getDb();
        await db.putSubscription({
            treeEventScopeId,
            lastEventId: eventId,
            lastEventIdTime: Date.now(),
        });
    }
}
