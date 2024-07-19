import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { SelectionState } from '../hooks/useSelectionControls';
import { useSelectionControls } from '../hooks/useSelectionControls';
import type { BrowserItemId } from '../interface';

export interface Item<T = any> {
    id: BrowserItemId;
    data: T;
    disabled?: boolean;
}

interface SelectionFunctions {
    selectedItemIds: BrowserItemId[];
    toggleSelectItem: (id: BrowserItemId) => void;
    toggleAllSelected: () => void;
    selectItem: (id: BrowserItemId) => void;
    clearSelections: () => void;
    toggleRange: (selectedBrowserItemId: BrowserItemId) => void;
    isSelected: (linkId: string) => boolean;
    selectionState: SelectionState;
}

const SelectionContext = createContext<SelectionFunctions | null>(null);

interface Props {
    itemIds: string[];
    children: ReactNode;
}

export function SelectionProvider({ itemIds, children }: Props) {
    const selectionFunction = useSelectionControls({ itemIds });

    return <SelectionContext.Provider value={selectionFunction}>{children}</SelectionContext.Provider>;
}

export function useSelection() {
    const state = useContext(SelectionContext);
    if (!state) {
        return null;
    }
    return state;
}
