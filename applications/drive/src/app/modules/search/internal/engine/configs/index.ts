import type { BaseBulkUpdater } from '../core/indexer/BaseBulkUpdater';
import type { BaseSearcher, SearcherParams } from '../core/searcher/BaseSearcher';
import { BulkUpdaterV1 } from './v1/indexer/BulkUpdaterV1';
import { SearcherV1 } from './v1/searcher/SearcherV1';

// Explicit union of all config keys — defined first to avoid circular references.
export type EngineConfigKey = 'v1' | 'testConfig';

// Each config defines the set of components used by the an engine.
export type EngineConfig = {
    configKey: EngineConfigKey;
    configName: string;
    BulkUpdater: new () => BaseBulkUpdater;
    Searcher: new (params: SearcherParams) => BaseSearcher;
    // TODO: Add IncrementalUpdater
    // TODO: Add SyncCursor
    // TODO: Add Cleaner
};

// Registry of all available engine configurations.
export const ENGINE_CONFIGS: Record<EngineConfigKey, EngineConfig> = {
    v1: {
        configKey: 'v1',
        // TODO: Remove configName and replace by configKey.
        configName: 'v1',
        BulkUpdater: BulkUpdaterV1,
        Searcher: SearcherV1,
    },

    // DO NOT USE: Another config, only for unit tests.
    testConfig: {
        configKey: 'testConfig',
        configName: 'testConfig',
        BulkUpdater: BulkUpdaterV1,
        Searcher: SearcherV1,
    },
};

export function getEngineConfig(configKey: EngineConfigKey): EngineConfig {
    return ENGINE_CONFIGS[configKey];
}

export function getEngineConfigFromString(configKey: string): EngineConfig | null {
    if (configKey in ENGINE_CONFIGS) {
        return ENGINE_CONFIGS[configKey as EngineConfigKey];
    }
    return null;
}
