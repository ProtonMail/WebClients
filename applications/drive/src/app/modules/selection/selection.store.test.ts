import { useSelectionStore } from './selection.store';
import { SelectionState } from './types';

describe('selectionStore', () => {
    beforeEach(() => {
        useSelectionStore.getState().clearSelections();
        useSelectionStore.getState().setAllItemIds([]);
    });

    describe('initialization', () => {
        it('should initialize with empty state', () => {
            const state = useSelectionStore.getState();

            expect(state.selectedItemIds.size).toBe(0);
            expect(state.multiSelectStartId).toBeUndefined();
            expect(state.allItemIds).toEqual([]);
            expect(state.getSelectionState()).toBe(SelectionState.NONE);
        });
    });

    describe('setAllItemIds', () => {
        it('should update allItemIds', () => {
            useSelectionStore.getState().setAllItemIds(['id1', 'id2', 'id3']);

            const state = useSelectionStore.getState();
            expect(state.allItemIds).toEqual(['id1', 'id2', 'id3']);
        });

        it('should filter out invalid selections when items change', () => {
            useSelectionStore.getState().setAllItemIds(['id1', 'id2', 'id3']);
            useSelectionStore.getState().toggleSelectItem('id1');
            useSelectionStore.getState().toggleSelectItem('id2');

            expect(useSelectionStore.getState().selectedItemIds.size).toBe(2);

            useSelectionStore.getState().setAllItemIds(['id2', 'id3', 'id4']);

            expect(useSelectionStore.getState().selectedItemIds).toEqual(new Set(['id2']));
        });

        it('should clear multiSelectStartId if it becomes invalid', () => {
            useSelectionStore.getState().setAllItemIds(['id1', 'id2', 'id3']);
            useSelectionStore.getState().selectItem('id1');

            expect(useSelectionStore.getState().multiSelectStartId).toBe('id1');

            useSelectionStore.getState().setAllItemIds(['id2', 'id3', 'id4']);

            expect(useSelectionStore.getState().multiSelectStartId).toBeUndefined();
        });
    });

    describe('toggleSelectItem', () => {
        beforeEach(() => {
            useSelectionStore.getState().setAllItemIds(['id1', 'id2', 'id3']);
        });

        it('should select an unselected item', () => {
            useSelectionStore.getState().toggleSelectItem('id1');

            const state = useSelectionStore.getState();
            expect(state.isSelected('id1')).toBe(true);
            expect(state.multiSelectStartId).toBe('id1');
        });

        it('should deselect a selected item', () => {
            useSelectionStore.getState().toggleSelectItem('id1');
            useSelectionStore.getState().toggleSelectItem('id1');

            expect(useSelectionStore.getState().isSelected('id1')).toBe(false);
        });

        it('should update multiSelectStartId on toggle', () => {
            useSelectionStore.getState().toggleSelectItem('id1');
            expect(useSelectionStore.getState().multiSelectStartId).toBe('id1');

            useSelectionStore.getState().toggleSelectItem('id2');
            expect(useSelectionStore.getState().multiSelectStartId).toBe('id2');
        });

        it('should clear multiSelectStartId when last item is deselected', () => {
            useSelectionStore.getState().toggleSelectItem('id1');
            useSelectionStore.getState().toggleSelectItem('id1');

            expect(useSelectionStore.getState().multiSelectStartId).toBeUndefined();
        });
    });

    describe('toggleAllSelected', () => {
        beforeEach(() => {
            useSelectionStore.getState().setAllItemIds(['id1', 'id2', 'id3']);
        });

        it('should select all items when none are selected', () => {
            useSelectionStore.getState().toggleAllSelected();

            const state = useSelectionStore.getState();
            expect(state.getSelectionState()).toBe(SelectionState.ALL);
            expect(state.selectedItemIds.size).toBe(3);
        });

        it('should deselect all items when all are selected', () => {
            useSelectionStore.getState().toggleAllSelected();
            useSelectionStore.getState().toggleAllSelected();

            const state = useSelectionStore.getState();
            expect(state.getSelectionState()).toBe(SelectionState.NONE);
            expect(state.selectedItemIds.size).toBe(0);
        });

        it('should select all items when some are selected', () => {
            useSelectionStore.getState().toggleSelectItem('id1');
            useSelectionStore.getState().toggleAllSelected();

            expect(useSelectionStore.getState().getSelectionState()).toBe(SelectionState.ALL);
        });

        it('should clear multiSelectStartId', () => {
            useSelectionStore.getState().toggleSelectItem('id1');
            useSelectionStore.getState().toggleAllSelected();

            expect(useSelectionStore.getState().multiSelectStartId).toBeUndefined();
        });
    });

    describe('toggleRange', () => {
        beforeEach(() => {
            useSelectionStore.getState().setAllItemIds(['id1', 'id2', 'id3', 'id4', 'id5']);
        });

        it('should select single item when no start is set', () => {
            useSelectionStore.getState().toggleRange('id3');

            const state = useSelectionStore.getState();
            expect(state.selectedItemIds).toEqual(new Set(['id3']));
            expect(state.multiSelectStartId).toBe('id3');
        });

        it('should select range from start to end', () => {
            useSelectionStore.getState().selectItem('id2');
            useSelectionStore.getState().toggleRange('id4');

            expect(useSelectionStore.getState().selectedItemIds).toEqual(new Set(['id2', 'id3', 'id4']));
        });

        it('should select range backward (end to start)', () => {
            useSelectionStore.getState().selectItem('id4');
            useSelectionStore.getState().toggleRange('id2');

            expect(useSelectionStore.getState().selectedItemIds).toEqual(new Set(['id2', 'id3', 'id4']));
        });
    });

    describe('selectItem', () => {
        beforeEach(() => {
            useSelectionStore.getState().setAllItemIds(['id1', 'id2', 'id3']);
        });

        it('should select single item', () => {
            useSelectionStore.getState().selectItem('id2');

            const state = useSelectionStore.getState();
            expect(state.selectedItemIds).toEqual(new Set(['id2']));
            expect(state.multiSelectStartId).toBe('id2');
        });

        it('should replace previous selection', () => {
            useSelectionStore.getState().toggleSelectItem('id1');
            useSelectionStore.getState().toggleSelectItem('id2');
            useSelectionStore.getState().selectItem('id3');

            expect(useSelectionStore.getState().selectedItemIds).toEqual(new Set(['id3']));
        });

        it('should not update state when selecting already selected single item', () => {
            useSelectionStore.getState().selectItem('id1');

            const stateBefore = useSelectionStore.getState();

            useSelectionStore.getState().selectItem('id1');

            expect(useSelectionStore.getState()).toBe(stateBefore);
        });
    });

    describe('clearSelections', () => {
        it('should clear all selections', () => {
            useSelectionStore.getState().setAllItemIds(['id1', 'id2', 'id3']);
            useSelectionStore.getState().toggleSelectItem('id1');
            useSelectionStore.getState().toggleSelectItem('id2');
            useSelectionStore.getState().clearSelections();

            const state = useSelectionStore.getState();
            expect(state.selectedItemIds.size).toBe(0);
            expect(state.multiSelectStartId).toBeUndefined();
            expect(state.getSelectionState()).toBe(SelectionState.NONE);
        });
    });

    describe('isSelected', () => {
        beforeEach(() => {
            useSelectionStore.getState().setAllItemIds(['id1', 'id2', 'id3']);
            useSelectionStore.getState().toggleSelectItem('id1');
            useSelectionStore.getState().toggleSelectItem('id3');
        });

        it('should return true for selected items', () => {
            const state = useSelectionStore.getState();

            expect(state.isSelected('id1')).toBe(true);
            expect(state.isSelected('id3')).toBe(true);
        });

        it('should return false for unselected items', () => {
            expect(useSelectionStore.getState().isSelected('id2')).toBe(false);
        });
    });

    describe('getSelectedItemIds', () => {
        it('should return array of selected IDs', () => {
            useSelectionStore.getState().setAllItemIds(['id1', 'id2', 'id3']);
            useSelectionStore.getState().toggleSelectItem('id1');
            useSelectionStore.getState().toggleSelectItem('id3');

            const selected = useSelectionStore.getState().getSelectedItemIds();

            expect(selected).toHaveLength(2);
            expect(selected).toContain('id1');
            expect(selected).toContain('id3');
        });

        it('should return empty array when nothing is selected', () => {
            expect(useSelectionStore.getState().getSelectedItemIds()).toEqual([]);
        });
    });
});
