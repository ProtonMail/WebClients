import { renderHook, act } from '@testing-library/react-hooks';

import useSelection from './useSelection';

const ALL_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const DISABLED_IDS = [2];
const ENABLED_IDS = ALL_IDS.filter((id) => !DISABLED_IDS.includes(id));

function makeItem(id: number) {
    return {
        id,
        disabled: DISABLED_IDS.includes(id),
        data: makeItemData(id),
    };
}

function makeItemData(id: number) {
    return { id };
}

describe('useSelection', () => {
    let hook: {
        current: ReturnType<typeof useSelection>;
    };

    beforeEach(() => {
        const { result } = renderHook(() => useSelection(ALL_IDS.map(makeItem)));
        hook = result;
    });

    it('toggleSelectItem', async () => {
        act(() => {
            hook.current.toggleSelectItem(1);
        });
        expect(hook.current.selectedItems).toMatchObject([makeItemData(1)]);
    });

    it('toggleAllSelected', async () => {
        act(() => {
            hook.current.toggleAllSelected();
        });
        expect(hook.current.selectedItems).toMatchObject(ENABLED_IDS.map(makeItemData));
    });

    it('toggleRange', async () => {
        act(() => {
            hook.current.selectItem(3);
        });
        act(() => {
            hook.current.toggleRange(5);
        });
        expect(hook.current.selectedItems).toMatchObject([3, 4, 5].map(makeItemData));
    });

    it('selectItem', async () => {
        act(() => {
            hook.current.selectItem(1);
        });
        act(() => {
            hook.current.selectItem(3);
        });
        expect(hook.current.selectedItems).toMatchObject([makeItemData(3)]);
    });

    it('clearSelection', async () => {
        act(() => {
            hook.current.toggleAllSelected();
        });
        act(() => {
            hook.current.clearSelections();
        });
        expect(hook.current.selectedItems).toMatchObject([]);
    });
});
