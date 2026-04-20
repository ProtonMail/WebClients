import { Logger } from '../shared/Logger';
import type { SearchDB } from '../shared/SearchDB';
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
    private channel: SearchModuleStateUpdateChannel;

    constructor(
        private readonly userId: UserId,
        private readonly dbPromise: Promise<SearchDB>
    ) {
        this.channel = createSearchModuleStateUpdateChannel(userId);
    }

    async isOptedIn(): Promise<boolean> {
        const db = await this.dbPromise;
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
        const db = await this.dbPromise;
        await db.setOptedIn();
        Logger.info('SearchOptInManager: opted in');
        this.channel.postMessage({ isUserOptIn: true });
    }

    dispose(): void {
        this.channel.close();
    }
}
