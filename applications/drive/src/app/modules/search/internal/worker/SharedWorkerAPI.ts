import { Logger } from '../Logger';
import type { MainThreadBridge } from '../MainThreadBridge';
import { MainThreadBridgeService } from '../MainThreadBridgeService';
import { EngineOrchestrator } from '../engineOrchestrator';
import type { ClientId, UserId } from '../types';
import type { ClientContext } from './ClientCoordinator';
import { ClientCoordinator } from './ClientCoordinator';

const REQUIRED_CONFIG_KEY_FOR_DEFAULT_ENGINE = 'v1';

export class SharedWorkerAPI {
    private clientsCoordinator = new ClientCoordinator();
    private readonly bridgeService = new MainThreadBridgeService();
    private unsubscribe: (() => void) | null = null;
    private orchestrator: EngineOrchestrator | null = null;

    constructor() {
        this.unsubscribe = this.clientsCoordinator.subscribeClientChanged(this.handleActiveClientChanged.bind(this));
    }

    private handleActiveClientChanged(newClientContext: ClientContext | null) {
        if (newClientContext) {
            void this.onClientAvailable(newClientContext);
        } else {
            this.orchestrator?.stop();
            this.orchestrator = null;
        }
    }

    private async onClientAvailable(clientContext: ClientContext): Promise<void> {
        // Always update the service — all engines react automatically.
        this.bridgeService.update(clientContext.bridge);

        if (this.orchestrator) {
            return;
        }

        // First client: bootstrap the orchestrator and start engines.
        try {
            this.orchestrator = new EngineOrchestrator(clientContext.userId, this.bridgeService);
            // NOTE: Orchestrator configuration could be extracted when we have more than
            // one engine configured.
            await this.orchestrator.addEngine('DEFAULT', REQUIRED_CONFIG_KEY_FOR_DEFAULT_ENGINE);
            this.orchestrator.start();
        } catch (error) {
            Logger.error('SharedWorkerAPI: failed to start the engine orchestrator', error);
        }
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
        this.orchestrator?.stop();
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    // TODO: Add search query API.
    // TODO: Monitor network availability and pause/resume indexing accordingly.
}
