import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import type { SearchDB } from '../shared/SearchDB';
import type { SearchMetrics } from '../shared/searchMetrics';
import type { IndexRegistry } from '../worker/index/IndexRegistry';
import type { TreeSubscriptionRegistry } from '../worker/indexer/TreeSubscriptionRegistry';
import type { TaskContext } from '../worker/indexer/tasks/BaseTask';

// All `mark*` methods are no-ops.
const noopSearchMetrics = new Proxy({} as SearchMetrics, {
    get: () => () => {},
});

/**
 * A `SearchMetrics` where the listed methods are the given spies and every other `mark*` is still a
 * no-op. Use this instead of passing a bare object literal as `searchMetrics`: a literal replaces
 * the whole no-op proxy, so any *other* metric the code under test happens to emit throws
 * "undefined is not a function" - a failure that depends on which paths fire, not on the behaviour
 * being asserted.
 */
export function makeSearchMetricsSpies(spies: Partial<SearchMetrics>): SearchMetrics {
    return new Proxy({} as SearchMetrics, {
        get: (_target, prop) => (prop in spies ? spies[prop as keyof SearchMetrics] : () => {}),
    });
}

/**
 * Creates a TaskContext with all fields pre-populated as vi mocks/stubs.
 * Callers override specific fields as needed.
 */
export function makeTaskContext(overrides?: Partial<TaskContext>): TaskContext {
    return {
        bridge: {} as MainThreadBridge,
        db: {
            getPopulatorState: vi.fn().mockResolvedValue({ generation: 1, version: 1, done: false }),
            putPopulatorState: vi.fn().mockResolvedValue(undefined),
            getBFSVisitorState: vi.fn().mockResolvedValue(undefined),
            putBFSVisitorState: vi.fn().mockResolvedValue(undefined),
            deleteBFSVisitorState: vi.fn().mockResolvedValue(undefined),
        } as unknown as SearchDB,
        indexRegistry: { getAll: vi.fn().mockReturnValue([].values()) } as unknown as IndexRegistry,
        treeSubscriptionRegistry: {
            getAllRegistrations: vi.fn().mockReturnValue([]),
            getRegistration: vi.fn().mockReturnValue(undefined),
            markIncrementalUpdateComplete: vi.fn(),
            startIncrementalUpdateScheduling: vi.fn(),
        } as unknown as TreeSubscriptionRegistry,
        signal: new AbortController().signal,
        searchMetrics: noopSearchMetrics,
        markIndexing: vi.fn(),
        enqueueOnce: vi.fn(),
        enqueueDelayed: vi.fn(),
        notifyIndexingProgress: vi.fn(),
        activeIndexPopulators: [],
        getIndexPopulator: vi.fn().mockReturnValue(undefined),
        ...overrides,
    };
}
