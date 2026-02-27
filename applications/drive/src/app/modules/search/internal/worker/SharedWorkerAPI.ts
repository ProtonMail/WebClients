import { Logger } from '../Logger';
import type { ClientId, UserId } from '../types';
import type { ClientContext } from './ClientCoordinator';
import { ClientCoordinator } from './ClientCoordinator';
import { DummyIndexer } from './indexing';
import type { MainThreadBridge } from './indexing/types';

export class SharedWorkerAPI {
    private clientsCoordinator = new ClientCoordinator();
    private unsubscribe: (() => void) | null = null;

    constructor() {
        this.unsubscribe = this.clientsCoordinator.subscribeClientChanged(this.handleActiveClientChanged.bind(this));
    }

    private handleActiveClientChanged(newClientContext: ClientContext | null) {
        if (newClientContext) {
            this.resumeStateMachine(newClientContext);
        }
        // TODO: else stop indexing state machine
    }

    // Dummy API to test sharedworkers.
    private resumeStateMachine(clientContext: ClientContext) {
        const indexer = new DummyIndexer(clientContext.bridge);
        void indexer.start();
    }

    registerClient(userId: UserId, clientId: ClientId, bridge: MainThreadBridge) {
        Logger.info(`SharedWorkerAPI: client registered <${clientId}>`);
        this.clientsCoordinator.register(userId, clientId, bridge);
    }

    heartbeatClient(clientId: ClientId) {
        Logger.info(`SharedWorkerAPI: client heartbeat <${clientId}>`);
        this.clientsCoordinator.heartbeat(clientId);
    }

    disconnectClient(clientId: ClientId) {
        Logger.info(`SharedWorkerAPI: client disconnected <${clientId}>`);
        this.clientsCoordinator.disconnect(clientId);
    }

    dispose() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    // TODO: Add search engine search/index building APIs.
}
