import { ItemState } from '../../types/data/items';
import type { State } from '../types';
import { selectItemsByShareId, selectItemsInFolder } from './items';

const item = (shareId: string, itemId: string, folderId: string | null = null) => ({
    shareId,
    itemId,
    folderId,
    state: ItemState.Active,
});

const mockState = {
    items: {
        byShareId: {
            shareA: { itemA: item('shareA', 'itemA') },
            shareB: { itemB: item('shareB', 'itemB'), itemBFolder: item('shareB', 'itemBFolder', 'folder') },
            optimistic: { history: [], checkpoint: undefined },
        },
    },
} as unknown as State;

const ids = (items: { itemId: string }[]) => items.map(({ itemId }) => itemId);

describe('selectItemsByShareId', () => {
    it('returns items of the requested share only', () => {
        expect(ids(selectItemsByShareId('shareA')(mockState))).toEqual(['itemA']);
    });

    it('returns items of every share when no share is requested', () => {
        expect(ids(selectItemsByShareId()(mockState))).toEqual(['itemA', 'itemB', 'itemBFolder']);
    });

    it('returns no items when the requested share does not exist', () => {
        expect(selectItemsByShareId('removedShare')(mockState)).toEqual([]);
    });
});

describe('selectItemsInFolder', () => {
    it('returns no items when the requested share does not exist', () => {
        expect(selectItemsInFolder('removedShare', null)(mockState)).toEqual([]);
    });
});
