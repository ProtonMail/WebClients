import type { TreeEventScopeId } from '../shared/types';
import { IndexPopulator } from '../worker/indexer/indexPopulators/IndexPopulator';

export const makeTestPopulator = (
    id: string = 'pop-1',
    scopeId: TreeEventScopeId = 'scope-1' as TreeEventScopeId,
    overrides: Partial<IndexPopulator> = {}
): IndexPopulator =>
    ({
        getUid: () => IndexPopulator.buildUid(id, scopeId),
        treeEventScopeId: scopeId,
        indexKind: 'main',
        indexPopulatorKind: id,
        processIncrementalUpdates: vi.fn(async (events: unknown[]) => events.length),
        repairNode: vi.fn(async () => {}),
        ...overrides,
    }) as unknown as IndexPopulator;
