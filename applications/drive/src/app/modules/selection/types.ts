export enum SelectionState {
    NONE,
    ALL,
    SOME,
}

export interface SelectionStore {
    selectedItemIds: Set<string>;
    multiSelectStartId: string | undefined;
    allItemIds: string[];

    setAllItemIds: (itemIds: Set<string>) => void;
    toggleSelectItem: (id: string) => void;
    toggleAllSelected: () => void;
    toggleRange: (id: string) => void;
    selectItem: (id: string) => void;
    clearSelections: () => void;
    isSelected: (id: string) => boolean;
    getSelectionState: () => SelectionState;
    getSelectedItemIds: () => string[];
}
