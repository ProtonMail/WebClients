import { type FC, type PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';

import type { MaybeNull, SelectedItem } from '@proton/pass/types';

export type BulkSelection = Map<string, Set<string>>;

type BulkSelectContextType = {
    count: number;
    enabled: boolean;
    selection: BulkSelection;
    clear: () => void;
    disable: () => void;
    enable: () => void;
    isSelected: (item: { shareId: string; itemId: string }) => boolean;
    select: ({ shareId, itemId }: SelectedItem) => void;
    unselect: ({ shareId, itemId }: SelectedItem) => void;
};

const BulkSelectContext = createContext<MaybeNull<BulkSelectContextType>>(null);

export const BulkSelectProvider: FC<PropsWithChildren> = ({ children }) => {
    const [selection, setSelection] = useState<BulkSelection>(new Map());
    const [enabled, setEnabled] = useState(false);

    const context = useMemo<BulkSelectContextType>(() => {
        const clear = () => setSelection(new Map());

        return {
            count: Array.from(selection.values()).reduce((count, { size }) => count + size, 0),
            enabled,
            selection,
            clear,
            disable: () => {
                setEnabled(false);
                clear();
            },
            enable: () => setEnabled(true),
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
    }, [selection, enabled]);

    useEffect(() => {
        const handleKeyUp = (event: KeyboardEvent) => {
            if (enabled && context.count === 0) context.disable();
            if (event.key === 'Shift') document.removeEventListener('keyup', handleKeyUp);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (!enabled && event.key === 'Shift') context.enable();
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keyup', handleKeyUp);
        };
    }, [enabled, context.count]);

    return <BulkSelectContext.Provider value={context}>{children}</BulkSelectContext.Provider>;
};

export const useBulkSelect = (): BulkSelectContextType => useContext(BulkSelectContext)!;
