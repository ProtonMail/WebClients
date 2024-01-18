import React, { createContext, useContext, useMemo, useState } from 'react';

import type { MaybeNull, SelectedItem } from '@proton/pass/types';

type BulkSelectContextType = {
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
        const isSelected = ({ shareId, itemId }: SelectedItem) => selection.get(shareId)?.has(itemId) ?? false;

        const selectItem = ({ shareId, itemId }: SelectedItem) =>
            setSelection((curr) => {
                const shareSet = curr.get(shareId) ?? new Set();
                shareSet.add(itemId);
                return new Map(curr.set(shareId, shareSet));
            });

        const unselectItem = ({ shareId, itemId }: SelectedItem): void =>
            setSelection((curr) => {
                curr.get(shareId)?.delete(itemId);
                return new Map(curr);
            });

        const clear = () => setSelection(new Map());

        const enable = () => setIsBulk(true);

        const disable = () => {
            setIsBulk(false);
            clear();
        };

        return { selection, isBulk, enable, disable, isSelected, clear, selectItem, unselectItem };
    }, [selection, isBulk]);

    return <BulkSelectContext.Provider value={context}>{children}</BulkSelectContext.Provider>;
};

export const useBulkSelect = (): BulkSelectContextType => useContext(BulkSelectContext)!;
