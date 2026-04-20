import type { LatestEventIdProvider } from '@protontech/drive-sdk';

import type { SearchDB } from './SearchDB';
import type { TreeEventScopeId } from './types';
import { brandTreeEventScopeId } from './types';

/**
 * Persists event cursor positions to IndexedDB (via SearchDB) so the Drive SDK
 * can resume polling from the correct event ID after a page reload.
 *
 * Receives a shared SearchDB promise — does not open its own connection.
 */
export class PersistentLatestEventIdProvider implements LatestEventIdProvider {
    constructor(private readonly dbPromise: Promise<SearchDB>) {}

    async getLatestEventId(treeEventScopeId: string): Promise<string | null> {
        const db = await this.dbPromise;
        const sub = await db.getSubscription(brandTreeEventScopeId(treeEventScopeId) as TreeEventScopeId);
        return sub?.lastEventId ?? null;
    }

    async saveLatestEventId(treeEventScopeId: TreeEventScopeId, eventId: string): Promise<void> {
        const db = await this.dbPromise;
        await db.putSubscription({
            treeEventScopeId,
            lastEventId: eventId,
            lastEventIdTime: Date.now(),
        });
    }
}
