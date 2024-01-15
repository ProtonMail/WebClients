import React, { createContext, useContext, useMemo, useState } from 'react';

import type { MaybeNull, SelectedItem } from '@proton/pass/types';

type BulkSelectContextType = {
    count: number;
    isBulk: boolean;
    selection: Map<string, Set<string>>;
    clear: () => void;
    disable: () => void;
    enable: () => void;
    isSelected: (item: { shareId: string; itemId: string }) => boolean;
    selectItem: ({ shareId, itemId }: SelectedItem) => void;
    unselectItem: ({ shareId, itemId }: SelectedItem) => void;
};

const BulkSelectContext = createContext<MaybeNull<BulkSelectContextType>>(null);

export const BulkSelectProvider: React.FC = ({ children }) => {
    const [selection, setSelection] = useState<Map<string, Set<string>>>(new Map());
    const [isBulk, setIsBulk] = useState(false);

    const context = useMemo<BulkSelectContextType>(() => {
        const clear = () => setSelection(new Map());

        return {
            count: Array.from(selection.values()).reduce((count, { size }) => count + size, 0),
            isBulk,
            selection,
            clear,
            disable: () => {
                setIsBulk(false);
                clear();
            },
            enable: () => setIsBulk(true),
            isSelected: ({ shareId, itemId }) => selection.get(shareId)?.has(itemId) ?? false,
            selectItem: ({ shareId, itemId }) =>
                setSelection((curr) => {
                    const shareSet = curr.get(shareId) ?? new Set();
                    shareSet.add(itemId);
                    return new Map(curr.set(shareId, shareSet));
                }),
            unselectItem: ({ shareId, itemId }) =>
                setSelection((curr) => {
                    curr.get(shareId)?.delete(itemId);
                    return new Map(curr);
                }),
        };
    }, [selection, isBulk]);

    return <BulkSelectContext.Provider value={context}>{children}</BulkSelectContext.Provider>;
};

export const useBulkSelect = (): BulkSelectContextType => useContext(BulkSelectContext)!;
