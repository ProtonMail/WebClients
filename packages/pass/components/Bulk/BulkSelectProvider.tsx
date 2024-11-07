import { type FC, type PropsWithChildren, createContext, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectBulkSelectionAliasCount } from '@proton/pass/store/selectors';
import type { BulkSelectionDTO, SelectedItem } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

export type BulkSelection = Map<string, Set<string>>;

type BulkSelectContextType = {
    aliasCount: number;
    count: number;
    enabled: boolean;
    selection: BulkSelection;
    clear: () => void;
    disable: () => void;
    enable: () => void;
    isSelected: (item: { shareId: string; itemId: string }) => boolean;
    select: (item: SelectedItem) => void;
    unselect: (item: SelectedItem) => void;
};

const BulkSelectContext = createContext<BulkSelectContextType>({
    aliasCount: 0,
    count: 0,
    enabled: false,
    selection: new Map(),
    clear: noop,
    disable: noop,
    enable: noop,
    isSelected: () => false,
    select: noop,
    unselect: noop,
});

export const bulkSelectionDTO = (selection: BulkSelection): BulkSelectionDTO =>
    Array.from(selection.keys()).reduce<BulkSelectionDTO>((dto, shareId) => {
        dto[shareId] = {};
        selection.get(shareId)?.forEach((itemId) => {
            dto[shareId][itemId] = true;
        });

        return dto;
    }, {});

export const BulkSelectProvider: FC<PropsWithChildren> = ({ children }) => {
    const [selection, setSelection] = useState<BulkSelection>(new Map());
    const [enabled, setEnabled] = useState(false);
    const aliasCount = useSelector(selectBulkSelectionAliasCount(bulkSelectionDTO(selection)));

    const context = useMemo<BulkSelectContextType>(() => {
        const clear = () => setSelection(new Map());

        return {
            aliasCount,
            count: Array.from(selection.values()).reduce((count, { size }) => count + size, 0),
            enabled,
            selection,
            clear,

            enable: () => setEnabled(true),
            disable: pipe(() => setEnabled(false), clear),

            isSelected: ({ shareId, itemId }) => selection.get(shareId)?.has(itemId) ?? false,

            select: ({ shareId, itemId }) =>
                setSelection((curr) => {
                    const shareSet = curr.get(shareId) ?? new Set();
                    shareSet.add(itemId);
                    return new Map(curr.set(shareId, shareSet));
                }),

            unselect: ({ shareId, itemId }) =>
                setSelection((curr) => {
                    curr.get(shareId)?.delete(itemId);
                    return new Map(curr);
                }),
        };
    }, [selection, enabled, aliasCount]);

    return <BulkSelectContext.Provider value={context}>{children}</BulkSelectContext.Provider>;
};

export const useBulkSelect = (): BulkSelectContextType => useContext(BulkSelectContext);
