import { CleanUpOrphanTreeSubscriptionsTask } from './CleanUpOrphanTreeSubscriptionsTask';
import { CleanUpStaleBlobsTask } from './CleanUpStaleBlobsTask';
import { CleanUpStaleEngineTask } from './CleanUpStaleEngineTask';
import { CleanUpStaleGenerationsTask } from './CleanUpStaleGenerationsTask';
import { CleanUpStaleIndexPopulatorTask } from './CleanUpStaleIndexPopulatorTask';
import { CleanUpTreeEventScopeIdTask } from './CleanUpTreeEventScopeIdTask';

export const CLEANUP_TASKS = [
    CleanUpStaleGenerationsTask,
    CleanUpStaleBlobsTask,
    CleanUpStaleEngineTask,
    CleanUpStaleIndexPopulatorTask,
    CleanUpOrphanTreeSubscriptionsTask,
    CleanUpTreeEventScopeIdTask,
] as const;
