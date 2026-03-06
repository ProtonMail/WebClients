import { Logger } from '../Logger';
import type { MainThreadBridgeService } from '../MainThreadBridgeService';
import { Engine } from '../engine/Engine';
import type { EngineConfigKey } from '../engine/configs';
import { EngineDB } from '../engine/storage/EngineDB';
import type { UserId } from '../types';

/**
 * Manages a set of Engine instances, each engine has its own separate index and
 * indexer state machine.
 * The orchestrator is also responsible for forwarding search queries and
 * configuring the proper search result merge strategy.
 */
export class EngineOrchestrator {
    private readonly engines = new Map<EngineConfigKey, Engine>();

    constructor(
        private readonly userId: UserId,
        private readonly bridgeService: MainThreadBridgeService
    ) {}

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
        Logger.info(`EngineOrchestrator: engine <${engineLabel}> with config <${configKey}> added`);
    }

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
