import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import { Logger } from '../shared/Logger';
import { sendErrorReportForSearch } from '../shared/errors';
import type { ClientId, UserId } from '../shared/types';

const HEARTBEAT_TIMEOUT = 300_000; // 5 minutes — generous to survive browser throttling of background tabs.
const CLEANUP_PERIOD_MS = 3000;

export type ClientContext = {
    userId: UserId;
    clientId: ClientId;
    lastSeen: number;
    bridge: MainThreadBridge;
};

// TODO: Rename to TabCoordinator - it's less correct technically but clearer.
// TODO: Use page visiblity API to improve the disconnection logic (e.g. increase the
// heartbeat timeout or ping the heartbeat when page becomes visible again)
export class ClientCoordinator {
    private clients = new Map<ClientId, ClientContext>();
    private activeClientId: ClientId | null = null;
    private cleanupInterval: number | undefined;
    private subscribers = new Set<(context: ClientContext | null) => void>();

    subscribeClientChanged(listener: (clientContext: ClientContext | null) => void): () => void {
        this.subscribers.add(listener);
        return () => this.subscribers.delete(listener);
    }

    dispose() {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = undefined;
        this.subscribers.clear();
    }

    /**
     * Register a worker client with the SharedWorker.
     * Idempotent — safe to call again to update the bridge reference.
     */
    register(userId: UserId, clientId: ClientId, bridge: MainThreadBridge) {
        const clientContext = { userId, clientId, lastSeen: Date.now(), bridge };
        this.clients.set(clientId, clientContext);
        if (!this.activeClientId) {
            this.setActiveClient(clientContext);
        }
        if (this.cleanupInterval === undefined) {
            this.cleanupInterval = self.setInterval(() => this.cleanUpDeadClients(), CLEANUP_PERIOD_MS);
        }
    }

    heartbeat(clientId: ClientId) {
        const client = this.clients.get(clientId);
        if (client) {
            client.lastSeen = Date.now();
        }
    }

    disconnect(clientId: ClientId) {
        this.clients.delete(clientId);
        if (clientId === this.activeClientId) {
            this.electNextClient();
        }
        if (this.clients.size === 0) {
            this.dispose();
        }
    }

    getActiveClientId() {
        return this.activeClientId;
    }

    /** Clear active client so the next register call re-triggers onClientAvailable. */
    clearActiveClient() {
        this.activeClientId = null;
    }

    private setActiveClient(newClientContext: ClientContext | null) {
        this.activeClientId = newClientContext ? newClientContext.clientId : null;
        this.subscribers.forEach((fn) => fn(newClientContext));
        Logger.info(`ClientCoordinator: Active client set <${this.activeClientId}>`);
    }

    private electNextClient() {
        const [nextId] = this.clients.keys();
        if (!nextId) {
            this.setActiveClient(null);
            return;
        }
        const nextClientContext = this.clients.get(nextId);
        if (!nextClientContext) {
            this.setActiveClient(null);
            return;
        }
        this.setActiveClient(nextClientContext);
    }

    // Remove dead clients that did not beforeunload/disconnect properly.
    private cleanUpDeadClients() {
        const now = Date.now();
        for (const [clientId, { lastSeen }] of this.clients) {
            if (now - lastSeen > HEARTBEAT_TIMEOUT) {
                this.disconnect(clientId);
                // Clients normally disconnect via beforeunload in WorkerClient.
                // Heartbeat timeout is a fallback — report so we can track how often it happens.
                sendErrorReportForSearch(
                    'Search client disconnected by timeout',
                    new Error('Search client disconnected by timeout'),
                    {
                        extra: {
                            staleness: now - lastSeen,
                            remainingClients: this.clients.size,
                        },
                    }
                );
            }
        }
    }
}
