import type { MemberRole, NodeType } from '@proton/drive';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { SortField } from '../../modules/sorting';
import { defaultSharedWithMeSortConfig } from './sharedWithMe.sorting';
import { type DirectShareItem, type InvitationItem, ItemType } from './types';
import { useSharedWithMeStore } from './useSharedWithMe.store';

jest.mock('@proton/drive/legacy/errorHandling', () => ({ handleSdkError: jest.fn() }));
jest.mock('@proton/drive/legacy/sdkUtils/getNodeEntity', () => ({ getNodeEntity: jest.fn() }));
jest.mock('@proton/drive/modules/busDriver', () => ({ BusDriverEventName: {}, getBusDriver: jest.fn() }));

const makeDirectShare = (nodeUid: string, name: string, sharedOn: Date): DirectShareItem => ({
    nodeUid,
    shareId: `share-${nodeUid}`,
    itemType: ItemType.DIRECT_SHARE,
    name,
    type: 'file' as unknown as NodeType,
    size: undefined,
    mediaType: undefined,
    activeRevisionUid: undefined,
    haveSignatureIssues: false,
    role: 'viewer' as unknown as MemberRole,
    directShare: { sharedOn, sharedBy: 'someone@example.com' },
});

const makeInvitation = (nodeUid: string, name: string): InvitationItem => ({
    nodeUid,
    shareId: `share-${nodeUid}`,
    itemType: ItemType.INVITATION,
    name,
    type: 'file' as unknown as NodeType,
    size: undefined,
    mediaType: undefined,
    activeRevisionUid: undefined,
    invitation: { uid: `inv-${nodeUid}`, sharedBy: 'inviter@example.com' },
});

const expectNoItemsDisappeared = () => {
    const { sharedWithMeItems, sortedItemUids } = useSharedWithMeStore.getState();
    const itemKeys = Array.from(sharedWithMeItems.keys()).sort();
    const sortedKeys = [...sortedItemUids].sort();
    expect(sortedKeys).toEqual(itemKeys);
    expect(new Set(sortedItemUids).size).toBe(sortedItemUids.length);
};

describe('useSharedWithMeStore', () => {
    beforeEach(() => {
        useSharedWithMeStore.setState({
            sharedWithMeItems: new Map(),
            itemUids: new Set(),
            itemsWithInvitationPosition: new Set(),
            sortedItemUids: [],
            sortedRegularItemUids: [],
            sortField: SortField.sharedOn,
            direction: SORT_DIRECTION.DESC,
            sortConfig: defaultSharedWithMeSortConfig,
        });
    });

    it('keeps all items present after adding direct shares and an invitation', () => {
        const store = useSharedWithMeStore.getState();
        store.setSharedWithMeItem(makeDirectShare('a', 'Alpha', new Date('2024-01-01')));
        store.setSharedWithMeItem(makeDirectShare('b', 'Beta', new Date('2024-02-01')));
        store.setSharedWithMeItem(makeInvitation('c', 'Gamma'));

        expectNoItemsDisappeared();
        expect(useSharedWithMeStore.getState().sortedItemUids).toHaveLength(3);
        expect(useSharedWithMeStore.getState().sortedItemUids[0]).toBe('c');
    });

    it('removes only the targeted item', () => {
        const store = useSharedWithMeStore.getState();
        store.setSharedWithMeItem(makeDirectShare('a', 'Alpha', new Date('2024-01-01')));
        store.setSharedWithMeItem(makeDirectShare('b', 'Beta', new Date('2024-02-01')));

        store.removeSharedWithMeItem('a');

        expectNoItemsDisappeared();
        expect(useSharedWithMeStore.getState().sortedItemUids).toEqual(['b']);
    });

    it('keeps all items present after re-sorting', () => {
        const store = useSharedWithMeStore.getState();
        store.setSharedWithMeItem(makeDirectShare('a', 'Alpha', new Date('2024-01-01')));
        store.setSharedWithMeItem(makeDirectShare('b', 'Beta', new Date('2024-02-01')));
        store.setSharedWithMeItem(makeInvitation('c', 'Gamma'));

        store.setSorting({
            sortField: SortField.name,
            direction: SORT_DIRECTION.ASC,
            sortConfig: [{ field: SortField.name, comparator: defaultSharedWithMeSortConfig[1].comparator }],
        });

        expectNoItemsDisappeared();
    });

    it('keeps stale-cleaned items consistent', () => {
        const store = useSharedWithMeStore.getState();
        store.setSharedWithMeItem(makeDirectShare('a', 'Alpha', new Date('2024-01-01')));
        store.setSharedWithMeItem(makeDirectShare('b', 'Beta', new Date('2024-02-01')));

        store.cleanupStaleItems(ItemType.DIRECT_SHARE, new Set(['a']));

        expectNoItemsDisappeared();
        expect(useSharedWithMeStore.getState().sortedItemUids).toEqual(['a']);
    });

    it('does not drop an accepted invitation after clearing invitation positions', () => {
        const store = useSharedWithMeStore.getState();

        store.setSharedWithMeItem(makeDirectShare('a', 'Alpha', new Date('2024-01-01')));
        store.setSharedWithMeItem(makeInvitation('b', 'Beta'));
        expectNoItemsDisappeared();

        store.setSharedWithMeItem(makeDirectShare('b', 'Beta', new Date('2024-03-01')));
        expectNoItemsDisappeared();
        expect(useSharedWithMeStore.getState().itemsWithInvitationPosition.has('b')).toBe(true);
        expect(useSharedWithMeStore.getState().sortedItemUids[0]).toBe('b');

        store.clearItemsWithInvitationPosition();

        expectNoItemsDisappeared();
        expect(useSharedWithMeStore.getState().sortedItemUids).toContain('b');
        expect(useSharedWithMeStore.getState().sortedItemUids).toEqual(['b', 'a']);
    });
});
