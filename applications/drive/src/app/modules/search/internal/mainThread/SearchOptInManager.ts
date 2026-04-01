import { Logger } from '../shared/Logger';
import { SearchDB } from '../shared/SearchDB';
import type { SearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import { createSearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import type { UserId } from '../shared/types';

/**
 * Manages the user's opt-in preference for search.
 *
 * - Reads/writes opt-in state to IndexedDB via SearchDB.
 * - Broadcasts changes to all tabs via the shared search state BroadcastChannel.
 */
export class SearchOptInManager {
    private dbPromise: Promise<SearchDB> | null = null;
    private channel: SearchModuleStateUpdateChannel;

    constructor(private readonly userId: UserId) {
        this.channel = createSearchModuleStateUpdateChannel(userId);
    }

    private getDb(): Promise<SearchDB> {
        this.dbPromise ??= SearchDB.open(this.userId);
        return this.dbPromise;
    }

    async isOptedIn(): Promise<boolean> {
        const db = await this.getDb();
        return db.isOptedIn();
    }

    async optIn(): Promise<void> {
        const db = await this.getDb();
        await db.setOptedIn();
        Logger.info('SearchOptInManager: opted in');
        this.channel.postMessage({ isUserOptIn: true });
    }

    dispose(): void {
        this.channel.close();
    }
}
