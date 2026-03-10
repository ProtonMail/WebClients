import type { ActiveMainThreadBridgeService } from '../ActiveMainThreadBridgeService';
import { Logger } from '../Logger';
import { Engine } from '../engine/Engine';
import type { EngineConfigKey } from '../engine/configs';
import { EngineDB } from '../engine/storage/EngineDB';
import type { SearchModuleStateUpdateChannel } from '../searchModuleStateUpdateChannel';
import { createSearchModuleStateUpdateChannel } from '../searchModuleStateUpdateChannel';
import type { SearchModuleState, UserId } from '../types';

/**
 * Manages a set of Engine instances, each engine has its own separate index and
 * indexer state machine.
 * The orchestrator is also responsible for forwarding search queries and
 * configuring the proper search result merge strategy.
 */
export class EngineOrchestrator {
    private readonly engines = new Map<EngineConfigKey, Engine>();
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
    async addEngine(engineLabel: string, configKey: EngineConfigKey): Promise<void> {
        if (this.engines.has(configKey)) {
            Logger.warn(`EngineOrchestrator: engine <${engineLabel}> with config <${configKey}> already exists`);
            return;
        }

        const db = await EngineDB.open(this.userId, engineLabel);
        const engine = await Engine.create({ configKey, db, bridgeService: this.bridgeService });
        this.engines.set(configKey, engine);

        // No need to store unsubscribe callbacks, we can not remove engines from orchestrator
        // with the current implementation.
        engine.onStateChange(() => this.updateSearchModuleState());

        Logger.info(`EngineOrchestrator: engine <${engineLabel}> with config <${configKey}> added`);
    }

    private updateSearchModuleState(): void {
        const engineStates = [...this.engines.values()].map((e) => e.getState());

        // Aggregate engine states to create search module state.
        const newSearchModuleState: SearchModuleState = {
            isInitialIndexing: engineStates.some((s) => s.isInitialIndexing),
            isSearchable: engineStates.some((s) => s.isSearchable),
        };

        // Finally broadcast it through a channel to the SearchModule singleton.
        this.searchModuleStateUpdateChannel.postMessage(newSearchModuleState);
    }

    // TODO: search(query: SearchQuery): Promise<SearchResult[]> — fan out to all engines and merge results.

    /**
     * Start indexing on all engines.
     */
    start(): void {
        Logger.info(`EngineOrchestrator: starting ${this.engines.size} engine(s)`);
        for (const engine of this.engines.values()) {
            void engine.startIndexing();
        }
    }

    /**
     * Stop all running engines.
     */
    stop(): void {
        Logger.info(`EngineOrchestrator: stopping ${this.engines.size} engine(s)`);
        for (const engine of this.engines.values()) {
            engine.stopIndexing();
        }
    }

    // TODO: Define a shared token bucket to limit requests for all managed engines.
}
