import { LatestEventIdProvider } from '@proton/drive';

// TODO: Add real implementation based on indexeddb for incremental updates.
export class NoopLatestEventIdProvider extends LatestEventIdProvider {
    async getLatestEventId(_treeEventScopeId: string): Promise<string | null> {
        return null;
    }

    async saveLatestEventId(_treeEventScopeId: string, _eventId: string): Promise<void> {
        // noop
    }

    async removeEventScope(_treeEventScopeId: string): Promise<void> {
        // noop
    }
}
