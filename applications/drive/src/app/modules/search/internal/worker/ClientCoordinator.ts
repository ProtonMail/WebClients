import { Logger } from '../Logger';
import type { ClientId, UserId } from '../types';
import type { MainThreadBridge } from './indexing/types';

// How long we wait before considering a client dead.
const HEARTBEAT_TIMEOUT = 30000;

// Period to clean up the dead clients which did not sent a heartbeat.
const CLEANUP_PERIOD_MS = 3000;

export type ClientContext = {
    userId: UserId;
    clientId: ClientId;
    lastSeen: number;
    bridge: MainThreadBridge;
};

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

    register(userId: UserId, clientId: ClientId, bridge: MainThreadBridge) {
        const clientContext = { userId, clientId, lastSeen: Date.now(), bridge };
        this.clients.set(clientId, clientContext);
        if (!this.activeClientId) {
            this.setActiveClient(clientContext);
        }

        // Start looking for dead clients.
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

    private setActiveClient(newClientContext: ClientContext | null) {
        this.activeClientId = newClientContext ? newClientContext.clientId : null;

        this.subscribers.forEach((fn) => fn(newClientContext));
        Logger.info(`ClientCoordinator: Active client set <${this.activeClientId}>`);
    }

    // When a clients disappear (e.g. the tab is closed), we need to pick a new one.
    private electNextClient() {
        const [nextId] = this.clients.keys();
        const nextClientId = nextId ?? null;
        if (!nextClientId) {
            // No more active client to pick from.
            this.setActiveClient(null);
            return;
        }

        const nextClientContext = this.clients.get(nextClientId);
        if (!nextClientContext) {
            this.setActiveClient(null);
            Logger.error(`Missing client context for clientId <${nextClientId}>`);
            return;
        }

        this.setActiveClient(nextClientContext);
    }

    private cleanUpDeadClients() {
        const now = Date.now();
        for (const [clientId, { lastSeen }] of this.clients) {
            if (now - lastSeen > HEARTBEAT_TIMEOUT) {
                this.disconnect(clientId);
            }
        }
    }
}
