import { Logger } from '../shared/Logger';
import { SearchDB } from '../shared/SearchDB';
import { hasLegacyEncryptedSearchDb } from '../shared/encryptedSearchUtils';
import type { SearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import { createSearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import type { UserId } from '../shared/types';

/**
 * Manages the user's opt-in preference for search.
 *
 * - Reads/writes opt-in state to IndexedDB via SearchDB.
 * - Broadcasts changes to all tabs via the shared search state BroadcastChannel.
 * - Checks for prior opt-in approval from the legacy encrypted-search DB.
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
        const optedIn = await db.isOptedIn();
        if (optedIn) {
            return true;
        }

        const hasLegacySearchOptin = await hasLegacyEncryptedSearchDb(this.userId);
        if (hasLegacySearchOptin) {
            // TODO: instrument
            Logger.info('SearchOptInManager: auto-opting in from legacy search');
            // NOTE: The user is opt-in. The legacy DB will be deleted after the
            // initial indexing of the new search is done.
            await this.optIn();
            return true;
        }

        return false;
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
