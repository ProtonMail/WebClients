import type { BaseBulkUpdater } from '../core/indexer/BaseBulkUpdater';
import { BulkUpdaterV1 } from './v1/indexer/BulkUpdaterV1';

// Each config defines the set of components used by the an engine.
export type EngineConfig = {
    configName: string;
    BulkUpdater: new () => BaseBulkUpdater;
    // TODO: Add IncrementalUpdater
    // TODO: Add Searcher
    // TODO: Add SyncCursor
    // TODO: Add Cleaner
};

// Registry of all available engine configurations.
export const ENGINE_CONFIGS = {
    v1: {
        configName: 'v1' as const,
        BulkUpdater: BulkUpdaterV1,
    },
} as const satisfies Record<string, EngineConfig>;

export type EngineConfigKey = keyof typeof ENGINE_CONFIGS;

export function getEngineConfig(configKey: EngineConfigKey): EngineConfig {
    return ENGINE_CONFIGS[configKey];
}
