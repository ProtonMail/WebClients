import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import { Logger } from '../shared/Logger';
import type { SearchMetrics } from '../shared/searchMetrics';
import type { ClientId, UserId } from '../shared/types';

const HEARTBEAT_TIMEOUT = 300_000; // 5 minutes — generous to survive browser throttling of background tabs.
const CLEANUP_PERIOD_MS = 3000;

export type ClientContext = {
    userId: UserId;
    clientId: ClientId;
    lastHeartbeatAt: number;
    bridge: MainThreadBridge;
};

// TODO: Rename to TabCoordinator - it's less correct technically but clearer.
export class ClientCoordinator {
    private clients = new Map<ClientId, ClientContext>();
    private activeClientId: ClientId | null = null;
    private lastForegroundClientId: ClientId | null = null;
    private cleanupInterval: number | undefined;
    private subscribers = new Set<(context: ClientContext | null) => void>();

    constructor(
        // Getter so the coordinator picks up the currently-active bridged metrics; metrics
        // are dropped if no client is connected (This happens on worker init briefly or if all
        // tabs are closed - and the worker will be disposed/destroyed anyway).
        private readonly getSearchMetrics: () => SearchMetrics | null
    ) {}

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
        const clientContext: ClientContext = {
            userId,
            clientId,
            lastHeartbeatAt: Date.now(),
            bridge,
        };
        this.clients.set(clientId, clientContext);
        if (!this.activeClientId) {
            this.setActiveClient(clientContext);
        }
        if (this.cleanupInterval === undefined) {
            this.cleanupInterval = self.setInterval(() => this.cleanUpDeadClients(), CLEANUP_PERIOD_MS);
        }
    }

    /**
     * Mark `clientId` as alive and update foreground tracking if it claims foreground.
     * Returns `isClientRegistered: false` when the coordinator has no record of this
     * client (e.g. evicted by cleanUpDeadClients while the tab was throttled), so the
     * caller can re-register itself instead of going silent.
     */
    heartbeat(clientId: ClientId, isForeground: boolean): { isClientRegistered: boolean } {
        const client = this.clients.get(clientId);
        if (!client) {
            return { isClientRegistered: false };
        }
        client.lastHeartbeatAt = Date.now();
        if (isForeground) {
            // Last write wins: whichever tab most recently claimed foreground owns the slot.
            // Sticky: a heartbeat with isForeground=false does NOT clear the slot, so the
            // most recently focused tab remains our best guess if no other tab takes over.
            this.lastForegroundClientId = clientId;
        }
        return { isClientRegistered: true };
    }

    disconnect(clientId: ClientId) {
        this.clients.delete(clientId);
        if (clientId === this.lastForegroundClientId) {
            this.lastForegroundClientId = null;
        }
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
        // Preferred: the most recently focused (foreground) tab still connected.
        // Fallback: the freshest heartbeat, as a proxy for "still alive and most responsive".
        const foreground = this.lastForegroundClientId ? this.clients.get(this.lastForegroundClientId) : null;
        if (foreground) {
            this.setActiveClient(foreground);
            return;
        }
        let freshest: ClientContext | null = null;
        for (const client of this.clients.values()) {
            if (!freshest || client.lastHeartbeatAt > freshest.lastHeartbeatAt) {
                freshest = client;
            }
        }
        this.setActiveClient(freshest);
    }

    // Remove dead inactive clients that did not beforeunload/disconnect properly.
    private cleanUpDeadClients() {
        const now = Date.now();
        for (const [clientId, { lastHeartbeatAt }] of this.clients) {
            const isInactiveClient = clientId !== this.activeClientId;
            const isAboveTimeout = now - lastHeartbeatAt > HEARTBEAT_TIMEOUT;
            if (isInactiveClient && isAboveTimeout) {
                this.disconnect(clientId);
                // Clients normally disconnect via beforeunload in WorkerClient.
                // Heartbeat timeout is a fallback - report so we can track how often it happens.
                this.getSearchMetrics()?.markClientDisconnectTimeout({
                    staleness: now - lastHeartbeatAt,
                    remainingClients: this.clients.size,
                });
            }
        }
    }
}
