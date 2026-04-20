import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { PersistentLatestEventIdProvider } from './PersistentLatestEventIdProvider';
import { SearchDB } from './SearchDB';
import type { TreeEventScopeId } from './types';

const treeEventScopeId1 = 'scope-1' as TreeEventScopeId;
const treeEventScopeId2 = 'scope-2' as TreeEventScopeId;
const treeEventScopeId3 = 'scope-3' as TreeEventScopeId;
const treeEventScopeId4 = 'scope-4' as TreeEventScopeId;

describe('PersistentLatestEventIdProvider', () => {
    let provider: PersistentLatestEventIdProvider;

    beforeEach(() => {
        // Fresh IndexedDB for each test.
        indexedDB = new IDBFactory();
        provider = new PersistentLatestEventIdProvider(SearchDB.open('test-user'));
    });

    it('returns null when no subscription exists', async () => {
        expect(await provider.getLatestEventId(treeEventScopeId1)).toBeNull();
    });

    it('save then get round-trips', async () => {
        await provider.saveLatestEventId(treeEventScopeId1, 'evt-42');
        expect(await provider.getLatestEventId(treeEventScopeId1)).toBe('evt-42');
    });

    it('latest value wins after multiple saves', async () => {
        await provider.saveLatestEventId(treeEventScopeId1, 'evt-1');
        await provider.saveLatestEventId(treeEventScopeId1, 'evt-2');
        expect(await provider.getLatestEventId(treeEventScopeId1)).toBe('evt-2');
    });

    it('properly do multiple saves', async () => {
        await provider.saveLatestEventId(treeEventScopeId1, 'evt-1');
        await provider.saveLatestEventId(treeEventScopeId1, 'evt-2');
        await provider.saveLatestEventId(treeEventScopeId2, 'evt-50');
        await provider.saveLatestEventId(treeEventScopeId3, 'evt-34');
        await provider.saveLatestEventId(treeEventScopeId4, 'evt-121');

        expect(await provider.getLatestEventId(treeEventScopeId1)).toBe('evt-2');
        expect(await provider.getLatestEventId(treeEventScopeId2)).toBe('evt-50');
        expect(await provider.getLatestEventId(treeEventScopeId3)).toBe('evt-34');
        expect(await provider.getLatestEventId(treeEventScopeId4)).toBe('evt-121');
    });
});
