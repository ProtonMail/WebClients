import { useState, useEffect } from 'react';
import { FileBrowserItem } from './FileBrowser';

const useFileBrowser = (folderChildren: FileBrowserItem[]) => {
    const [selectedItemIds, setSelectedItems] = useState<string[]>([]);
    const [lastSelectedId, setLastSelectedId] = useState<string>();

    useEffect(() => {
        const isItemInFolder = (itemId: string) => folderChildren.some((item) => item.LinkID === itemId);
        const selected = selectedItemIds.filter(isItemInFolder);
        // If selected items were removed from children, remove them from selected as well
        if (selectedItemIds.length !== selected.length) {
            setSelectedItems(selected);
        }
    }, [folderChildren]);

    const toggleSelectItem = (id: string) => {
        setSelectedItems((ids) => {
            const filtered = ids.filter((itemId) => itemId !== id);
            const selected = filtered.length === ids.length;

            if (selected) {
                setLastSelectedId(id);
                return [...ids, id];
            }

            setLastSelectedId(undefined);
            return filtered;
        });
    };

    const toggleAllSelected = () => {
        setSelectedItems((ids) =>
            ids.length === folderChildren.length ? [] : folderChildren.map(({ LinkID }) => LinkID)
        );
    };

    const selectRange = (selectedItem: string) => {
        // range between item matching selectedItem and lastSelected

        const selected: string[] = [];
        let matchConditions = lastSelectedId ? [lastSelectedId, selectedItem] : [selectedItem];
        let i = 0;
        while (matchConditions.length) {
            const itemId = folderChildren[i].LinkID;
            if (matchConditions.includes(itemId)) {
                matchConditions = matchConditions.filter((id) => id !== itemId);
                selected.push(itemId);
            } else if (selected.length) {
                selected.push(itemId);
            }
            i++;
        }
        setSelectedItems([...selectedItemIds.filter((id) => !selected.includes(id)), ...selected]);
    };

    const selectItem = (id: string) => setSelectedItems([id]);
    const clearSelections = () => setSelectedItems([]);

    const selectedItems = folderChildren
        ? (selectedItemIds
              .map((selectedId) => folderChildren.find(({ LinkID }) => selectedId === LinkID))
              .filter(Boolean) as FileBrowserItem[])
        : [];

    return {
        toggleSelectItem,
        toggleAllSelected,
        selectItem,
        selectedItems,
        clearSelections,
        selectRange
    };
};

export default useFileBrowser;
