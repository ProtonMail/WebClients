import type { DriveEvent } from '@protontech/drive-sdk';

import type { SearchDriveClient } from '../mainThread/MainThreadBridge';

export class FakeSearchDriveClient implements SearchDriveClient {
    private subscriptions = new Map<string, (event: DriveEvent) => Promise<void>>();
    private disposedScopes = new Set<string>();

    async subscribeToTreeEvents(
        treeEventScopeId: string,
        callback: (event: DriveEvent) => Promise<void>
    ): Promise<{ dispose(): void }> {
        this.subscriptions.set(treeEventScopeId, callback);
        return {
            dispose: () => {
                this.subscriptions.delete(treeEventScopeId);
                this.disposedScopes.add(treeEventScopeId);
            },
        };
    }

    emitEvent(scopeId: string, event: DriveEvent): void {
        const callback = this.subscriptions.get(scopeId);
        if (!callback) {
            throw new Error(`FakeSearchDriveClient: no subscription for scope ${scopeId}`);
        }
        void callback(event);
    }

    wasDisposed(scopeId: string): boolean {
        return this.disposedScopes.has(scopeId);
    }
}
