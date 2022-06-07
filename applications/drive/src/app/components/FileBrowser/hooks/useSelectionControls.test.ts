import { renderHook, act } from '@testing-library/react-hooks';
import { useSelectionControls } from './useSelectionControls';

const ALL_IDS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

describe('useSelection', () => {
    let hook: {
        current: ReturnType<typeof useSelectionControls>;
    };

    beforeEach(() => {
        const { result } = renderHook(() => useSelectionControls({ itemIds: ALL_IDS }));
        hook = result;
    });

    it('toggleSelectItem', async () => {
        const itemIdToToggle = '1';
        act(() => {
            hook.current.toggleSelectItem(itemIdToToggle);
        });
        expect(hook.current.selectedItemIds).toMatchObject([itemIdToToggle]);
    });

    it('toggleAllSelected', async () => {
        act(() => {
            hook.current.toggleAllSelected();
        });
        expect(hook.current.selectedItemIds).toMatchObject(ALL_IDS);
    });

    it('toggleRange', async () => {
        act(() => {
            hook.current.selectItem('3');
        });
        act(() => {
            hook.current.toggleRange('5');
        });
        expect(hook.current.selectedItemIds).toMatchObject(['3', '4', '5']);
    });

    it('selectItem', async () => {
        act(() => {
            hook.current.selectItem('1');
        });
        act(() => {
            hook.current.selectItem('3');
        });
        expect(hook.current.selectedItemIds).toMatchObject(['3']);
    });

    it('clearSelection', async () => {
        act(() => {
            hook.current.toggleAllSelected();
        });
        act(() => {
            hook.current.clearSelections();
        });
        expect(hook.current.selectedItemIds).toMatchObject([]);
    });
});
