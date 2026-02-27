import { LatestEventIdProvider } from '@proton/drive/internal/latestEventIdProvider';

// TODO: Add real implementation based on indexeddb for incremental updates.
export class NoopLatestEventIdProvider extends LatestEventIdProvider {
    getLatestEventId(_treeEventScopeId: string): string | null {
        return null;
    }

    saveLatestEventId(_treeEventScopeId: string, _eventId: string): void {}

    removeEventScope(_treeEventScopeId: string): void {}
}
