import { createAsyncQueue } from '../../../../utils/asyncQueue';
import type { ActiveMainThreadBridgeService } from '../ActiveMainThreadBridgeService';
import { Logger } from '../Logger';
import { Engine } from '../engine/Engine';
import type { EngineConfigKey } from '../engine/configs';
import type { EngineSearchItem } from '../engine/core/searcher/BaseSearcher';
import { EngineDB } from '../engine/storage/EngineDB';
import type { SearchModuleStateUpdateChannel } from '../searchModuleStateUpdateChannel';
import { createSearchModuleStateUpdateChannel } from '../searchModuleStateUpdateChannel';
import type { EngineType, SdkType, SearchModuleState, SearchQuery, UserId } from '../types';

/**
 * Manages a set of Engine instances, each engine has its own separate index and
 * indexer state machine.
 * The orchestrator is also responsible for forwarding search queries and
 * configuring the proper search result merge strategy.
 */
type RegisteredEngine = {
    engine: Engine;
    engineType: EngineType;
    sdkType: SdkType;
};

export type OrchestratorSearchItem = EngineSearchItem & { engineType: EngineType; sdkType: SdkType };

export type AddEngineParams = {
    engineType: EngineType;
    configKey: EngineConfigKey;
    sdkType: SdkType;
};

export class EngineOrchestrator {
    private readonly engines = new Map<EngineConfigKey, RegisteredEngine>();
    private readonly searchModuleStateUpdateChannel: SearchModuleStateUpdateChannel;

    constructor(
        private readonly userId: UserId,
        private readonly bridgeService: ActiveMainThreadBridgeService
    ) {
        this.searchModuleStateUpdateChannel = createSearchModuleStateUpdateChannel(userId);
    }

    /**
     * Create and start an engine for the given config.
     * No-op if an engine for that config already exists.
     */
    async addEngine({ engineType, configKey, sdkType }: AddEngineParams): Promise<void> {
        if (this.engines.has(configKey)) {
            Logger.warn(`EngineOrchestrator: engine <${engineType}> with config <${configKey}> already exists`);
            return;
        }

        const db = await EngineDB.open(this.userId, engineType);
        const engine = await Engine.create({ configKey, db, bridgeService: this.bridgeService });
        this.engines.set(configKey, { engine, engineType, sdkType });

        // No need to store unsubscribe callbacks, we can not remove engines from orchestrator
        // with the current implementation.
        engine.onStateChange(() => this.updateSearchModuleState());

        Logger.info(`EngineOrchestrator: engine <${engineType}> with config <${configKey}> added`);
    }

    private updateSearchModuleState(): void {
        const engineStates = [...this.engines.values()].map((e) => e.engine.getState());

        // Aggregate engine states to create search module state.
        const newSearchModuleState: SearchModuleState = {
            isInitialIndexing: engineStates.some((s) => s.isInitialIndexing),
            isSearchable: engineStates.some((s) => s.isSearchable),
        };

        // Finally broadcast it through a channel to the SearchModule singleton.
        this.searchModuleStateUpdateChannel.postMessage(newSearchModuleState);
    }

    /**
     * Start indexing on all engines.
     */
    start(): void {
        Logger.info(`EngineOrchestrator: starting ${this.engines.size} engine(s)`);
        for (const { engine } of this.engines.values()) {
            void engine.startIndexing();
        }
    }

    /**
     * Stop all running engines.
     */
    stop(): void {
        Logger.info(`EngineOrchestrator: stopping ${this.engines.size} engine(s)`);
        for (const { engine } of this.engines.values()) {
            engine.stopIndexing();
        }
    }

    /**
     * Fan out the query to all engines, yield results as each engine produces them.
     * If an engine throws, its error is logged but results from other engines continue.
     */
    async *search(query: SearchQuery): AsyncGenerator<OrchestratorSearchItem> {
        const queue = createAsyncQueue<OrchestratorSearchItem>();

        const registered = [...this.engines.values()];

        const consumeEngine = async ({ engine, engineType, sdkType }: RegisteredEngine) => {
            try {
                for await (const item of engine.search(query)) {
                    queue.push({ ...item, engineType, sdkType });
                }
            } catch (error) {
                Logger.error('EngineOrchestrator: engine search failed', error);
                // TODO: If error is InvalidSearcherConfig, reset the engine
                // (clear DB state and restart indexing from scratch).
                // TODO: Accumulate errors and notify main thread for user notifications
                // using a broadcast channel.
            }
        };

        void Promise.allSettled(registered.map(consumeEngine)).then(() => queue.close());

        if (registered.length === 0) {
            queue.close();
        }

        yield* queue.iterator();
    }

    // TODO: Define a shared token bucket to limit requests for all managed engines.
}
