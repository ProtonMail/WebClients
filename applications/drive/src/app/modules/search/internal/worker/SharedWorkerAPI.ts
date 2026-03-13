import { ActiveMainThreadBridgeService } from '../ActiveMainThreadBridgeService';
import { Logger } from '../Logger';
import type { MainThreadBridge } from '../MainThreadBridge';
import { EngineOrchestrator } from '../engineOrchestrator';
import { InvalidOrchestratorState } from '../errors';
import { EngineType, SdkType } from '../types';
import type { ClientId, SearchQuery, WorkerSearchResultEvent, UserId } from '../types';
import type { ClientContext } from './ClientCoordinator';
import { ClientCoordinator } from './ClientCoordinator';

const REQUIRED_CONFIG_KEY_FOR_DEFAULT_ENGINE = 'v1';

export class SharedWorkerAPI {
    private clientsCoordinator = new ClientCoordinator();
    private readonly bridgeService = new ActiveMainThreadBridgeService();
    private unsubscribeClientChanged: (() => void) | null = null;
    private orchestrator: EngineOrchestrator | null = null;

    constructor() {
        this.unsubscribeClientChanged = this.clientsCoordinator.subscribeClientChanged(
            this.handleActiveClientChanged.bind(this)
        );
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
            await this.orchestrator.addEngine({
                engineType: EngineType.MY_FILES,
                configKey: REQUIRED_CONFIG_KEY_FOR_DEFAULT_ENGINE,
                sdkType: SdkType.DRIVE,
            });
            this.orchestrator.start();
        } catch (error) {
            Logger.error('SharedWorkerAPI: failed to start the engine orchestrator', error);
            this.orchestrator = null;
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

    /**
     * Stream search results to the main thread via a Comlink-proxied callback.
     *
     * Events and completion are sent through a single callback (one MessagePort)
     * to guarantee delivery order. We cannot rely on the Promise return for
     * signalling completion because it resolves on a different Comlink port,
     * which can race ahead of pending event messages.
     */
    async search(query: SearchQuery, onEvent?: (event: WorkerSearchResultEvent) => void): Promise<void> {
        if (!this.orchestrator) {
            const error = new InvalidOrchestratorState(`Search query done without ready orchestrator`);
            Logger.error(`SharedWorkerAPI: Search query done without ready orchestrator`, error);
            throw error;
        }

        for await (const item of this.orchestrator.search(query)) {
            onEvent?.({ type: 'item', ...item });
        }

        onEvent?.({ type: 'done' });
    }

    dispose() {
        this.orchestrator?.stop();
        this.orchestrator = null;
        if (this.unsubscribeClientChanged) {
            this.unsubscribeClientChanged();
        }
    }

    // TODO: Monitor network availability and pause/resume indexing accordingly.
}
