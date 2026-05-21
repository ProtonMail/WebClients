import { act, renderHook } from '@testing-library/react-hooks';

import { SelectionState, useSelectionControls } from './useSelectionControls';

const ALL_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

describe('useSelection', () => {
    let hook: {
        current: ReturnType<typeof useSelectionControls>;
    };
    let rerenderHook: (props?: unknown) => void;
    let itemIds = ALL_IDS;

    beforeEach(() => {
        const { result, rerender } = renderHook(() => useSelectionControls({ itemIds }));
        hook = result;
        rerenderHook = rerender;
    });

    it('toggleSelectItem', () => {
        const itemIdToToggle = '1';
        const secondItemIdToToggle = '2';
        act(() => {
            hook.current.toggleSelectItem(itemIdToToggle);
        });
        expect(hook.current.selectedItemIds).toMatchObject([itemIdToToggle]);

        // Select new item
        rerenderHook();
        act(() => {
            hook.current.toggleSelectItem(secondItemIdToToggle);
        });
        expect(hook.current.selectedItemIds).toMatchObject([itemIdToToggle, secondItemIdToToggle]);

        // Unselect items one by one
        rerenderHook();
        act(() => {
            hook.current.toggleSelectItem(itemIdToToggle);
            hook.current.toggleSelectItem(secondItemIdToToggle);
        });
        rerenderHook();
        expect(hook.current.selectedItemIds).toMatchObject([]);
    });

    it('toggleAllSelected', () => {
        act(() => {
            hook.current.toggleAllSelected();
        });
        expect(hook.current.selectedItemIds).toMatchObject(ALL_IDS);
    });

    it('toggleRange', () => {
        act(() => {
            hook.current.selectItem('3');
        });
        act(() => {
            hook.current.toggleRange('5');
        });
        expect(hook.current.selectedItemIds).toMatchObject(['3', '4', '5']);
    });

    it('toggleRange with no selectItem before', () => {
        act(() => {
            hook.current.toggleRange('5');
        });
        expect(hook.current.selectedItemIds).toMatchObject(['5']);
    });

    it('selectItem', () => {
        act(() => {
            hook.current.selectItem('1');
        });
        act(() => {
            hook.current.selectItem('3');
        });
        expect(hook.current.selectedItemIds).toMatchObject(['3']);
    });

    it('clearSelection', () => {
        act(() => {
            hook.current.toggleAllSelected();
        });
        act(() => {
            hook.current.clearSelections();
        });
        expect(hook.current.selectedItemIds).toMatchObject([]);
    });

    it('isSelected', () => {
        act(() => {
            hook.current.selectItem('2');
        });

        expect(hook.current.isSelected('2')).toBe(true);
        expect(hook.current.isSelected('1')).toBe(false);
    });

    it('selectionState', () => {
        act(() => {
            hook.current.selectItem('2');
            hook.current.selectItem('1');
        });

        expect(hook.current.selectionState).toBe(SelectionState.SOME);

        act(() => {
            hook.current.toggleAllSelected();
        });
        expect(hook.current.selectionState).toBe(SelectionState.ALL);

        act(() => {
            hook.current.toggleAllSelected();
        });
        expect(hook.current.selectionState).toBe(SelectionState.NONE);
    });

    it('should reset multiSelectedStartId on itemIds changes', () => {
        act(() => {
            hook.current.selectItem('3');
        });
        itemIds = ['10', '11', '12'];
        rerenderHook();
        act(() => {
            hook.current.toggleRange('10');
        });
        expect(hook.current.selectedItemIds).toMatchObject(['10']);
    });
});
