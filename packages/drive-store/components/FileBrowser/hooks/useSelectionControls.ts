import { useCallback, useEffect, useMemo, useState } from 'react';

import { BrowserItemId } from '../interface';

export enum SelectionState {
    NONE,
    ALL,
    SOME,
}
export function useSelectionControls({ itemIds }: { itemIds: BrowserItemId[] }) {
    const [selectedItemIds, setSelectedItems] = useState<BrowserItemId[]>([]);
    const [multiSelectStartId, setMultiSelectStartId] = useState<BrowserItemId>();

    const selectionState = useMemo(() => {
        if (selectedItemIds.length === 0) {
            return SelectionState.NONE;
        }
        if (selectedItemIds.length !== itemIds.length) {
            return SelectionState.SOME;
        }
        return SelectionState.ALL;
    }, [selectedItemIds, itemIds]);

    useEffect(() => {
        const isItemInFolder = (itemId: BrowserItemId) => itemIds.some((folderItemIds) => folderItemIds === itemId);
        const selected = selectedItemIds.filter(isItemInFolder);
        // If selected items were removed from children, remove them from selected as well
        if (selectedItemIds.length !== selected.length) {
            setSelectedItems(selected);
            setMultiSelectStartId(undefined);
        }
    }, [itemIds, selectedItemIds]);

    const toggleSelectItem = useCallback((id: BrowserItemId) => {
        setSelectedItems((selectedItemIds) => {
            const previousExcludingSelected = selectedItemIds.filter((itemId) => itemId !== id);
            const isPreviouslySelected = previousExcludingSelected.length !== selectedItemIds.length;

            if (!isPreviouslySelected || previousExcludingSelected.length) {
                setMultiSelectStartId(id);
            } else {
                setMultiSelectStartId(undefined);
            }

            return isPreviouslySelected ? previousExcludingSelected : [...selectedItemIds, id];
        });
    }, []);

    const toggleAllSelected = useCallback(() => {
        setSelectedItems((ids) => (ids.length === itemIds.length ? [] : [...itemIds]));
        setMultiSelectStartId(undefined);
    }, [itemIds]);

    const toggleRange = useCallback(
        (selectedBrowserItemId: BrowserItemId) => {
            // range between item matching selectedBrowserItemId and multiSelectStartId

            if (!multiSelectStartId) {
                setMultiSelectStartId(selectedBrowserItemId);
                setSelectedItems([selectedBrowserItemId]);
                return;
            }

            const selected: BrowserItemId[] = [];
            let i = 0;
            let matchConditions = [multiSelectStartId, selectedBrowserItemId];

            while (matchConditions.length) {
                const id = itemIds[i];
                if (matchConditions.includes(id)) {
                    matchConditions = matchConditions.filter((itemId) => itemId !== id);
                    selected.push(id);
                } else if (selected.length) {
                    selected.push(id);
                }
                i++;
            }

            setSelectedItems(selected);
        },
        [itemIds, multiSelectStartId]
    );

    const selectItem = useCallback(
        (id: BrowserItemId) => {
            // preventing same simple selection from happening to avoid re-rendering
            if (selectedItemIds.length !== 1 || selectedItemIds[0] !== id) {
                setSelectedItems([id]);
            }
            setMultiSelectStartId(id);
        },
        [selectedItemIds]
    );

    const clearSelections = useCallback(() => {
        setSelectedItems([]);
        setMultiSelectStartId(undefined);
    }, []);

    const isSelected = (itemId: BrowserItemId) => selectedItemIds.some((id) => id === itemId);

    return {
        selectedItemIds,
        toggleSelectItem,
        toggleAllSelected,
        selectItem,
        clearSelections,
        toggleRange,
        isSelected,
        selectionState,
    };
}
