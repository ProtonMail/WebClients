import { useState } from 'react';
import { FileBrowserItem } from './FileBrowser';

const useFileBrowser = (folderChildren: FileBrowserItem[]) => {
    const [selectedItemIds, setSelectedItems] = useState<string[]>([]);

    const toggleSelectItem = (id: string) => {
        setSelectedItems((ids) => {
            const filtered = ids.filter((itemId) => itemId !== id);
            const selected = filtered.length === ids.length;
            return selected ? [...ids, id] : filtered;
        });
    };

    const toggleAllSelected = () => {
        setSelectedItems((ids) =>
            ids.length === folderChildren.length ? [] : folderChildren.map(({ LinkID }) => LinkID)
        );
    };

    const selectRange = (selectedItem: string) => {
        // range between item matching selectedItem and lastSelected
        let matchConditions = selectedItemIds[0] ? [selectedItem, selectedItemIds[0]] : [selectedItem];
        const selected = [];
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
        setSelectedItems(selected);
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
