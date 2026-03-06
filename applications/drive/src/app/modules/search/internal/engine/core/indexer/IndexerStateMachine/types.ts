import type { MainThreadBridgeService } from '../../../../MainThreadBridgeService';
import type { EngineConfig, EngineConfigKey } from '../../../configs';
import type { EngineDB } from '../../../storage/EngineDB';
import type { IndexWriter } from '../IndexWriter';

/**
 * Everything a state handler in the indexer state machine needs.
 */
export interface IndexerContext {
    db: EngineDB;
    bridgeService: MainThreadBridgeService;
    indexWriter: IndexWriter;
    config: EngineConfig;
    requiredConfigKey: EngineConfigKey;
    lastError: unknown;
    // Incremented on each TRANSIENT_FAILURE entry; drives exponential back-off.
    // Reset to 0 on successful recovery.
    transientFailureCount: number;
}

export interface IndexerStateMachineParams {
    requiredConfigKey: EngineConfigKey;
    db: EngineDB;
    bridgeService: MainThreadBridgeService;
    indexWriter: IndexWriter;
}
