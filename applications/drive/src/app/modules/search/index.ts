export { SearchModule } from './internal/mainThread/SearchModule';
export { useSearchModule } from './internal/hooks/useSearchModule';
export type { UseSearchModuleReturn } from './internal/hooks/useSearchModule';
export { useUrlSearchParams } from './internal/hooks/useUrlSearchParam';
export { tryCatchWithNotification } from './internal/shared/errors';
export { searchMetrics, legacySearchMetrics } from './internal/shared/searchMetrics';
export type { SearchMetrics, LegacySearchMetrics } from './internal/shared/searchMetrics';
export { IndexKind } from './internal/shared/types';
export type {
    IndexingProgress,
    IndexPopulatorStatus,
    SearchModuleState,
    SearchQuery,
    SearchResultItem,
    SerializedIndexEntry,
    UserId,
} from './internal/shared/types';
