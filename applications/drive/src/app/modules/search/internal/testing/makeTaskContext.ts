import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import type { SearchDB } from '../shared/SearchDB';
import type { IndexRegistry } from '../worker/index/IndexRegistry';
import type { TreeSubscriptionRegistry } from '../worker/indexer/TreeSubscriptionRegistry';
import type { TaskContext } from '../worker/indexer/tasks/BaseTask';

/**
 * Creates a TaskContext with all fields pre-populated as jest mocks/stubs.
 * Callers override specific fields as needed.
 */
export function makeTaskContext(overrides?: Partial<TaskContext>): TaskContext {
    return {
        bridge: {} as MainThreadBridge,
        db: {
            getPopulatorState: jest.fn().mockResolvedValue({ generation: 1, version: 1, done: false }),
        } as unknown as SearchDB,
        indexRegistry: { getAll: jest.fn().mockReturnValue([].values()) } as unknown as IndexRegistry,
        treeSubscriptionRegistry: {
            getAllRegistrations: jest.fn().mockReturnValue([]),
            getRegistration: jest.fn().mockReturnValue(undefined),
            markIncrementalUpdateComplete: jest.fn(),
            startIncrementalUpdateScheduling: jest.fn(),
        } as unknown as TreeSubscriptionRegistry,
        signal: new AbortController().signal,
        markIndexing: jest.fn(),
        markInitialIndexing: jest.fn(),
        enqueueOnce: jest.fn(),
        enqueueDelayed: jest.fn(),
        ...overrides,
    };
}
