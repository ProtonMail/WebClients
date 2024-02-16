import {
    type FC,
    type PropsWithChildren,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import type { SelectedItem } from '@proton/pass/types';
import noop from '@proton/utils/noop';

export type BulkSelection = Map<string, Set<string>>;

type BulkSelectContextType = {
    count: number;
    enabled: boolean;
    selection: BulkSelection;
    clear: () => void;
    disable: () => void;
    enable: () => void;
    isSelected: (item: { shareId: string; itemId: string }) => boolean;
    lock: () => () => void;
    select: ({ shareId, itemId }: SelectedItem) => void;
    unlock: () => void;
    unselect: ({ shareId, itemId }: SelectedItem) => void;
};

const BulkSelectContext = createContext<BulkSelectContextType>({
    count: 0,
    enabled: false,
    selection: new Map(),
    clear: noop,
    disable: noop,
    enable: noop,
    isSelected: () => false,
    lock: () => noop,
    select: noop,
    unlock: noop,
    unselect: noop,
});

export const BulkSelectProvider: FC<PropsWithChildren> = ({ children }) => {
    const [selection, setSelection] = useState<BulkSelection>(new Map());
    const [enabled, setEnabled] = useState(false);
    const locked = useRef(false);

    const context = useMemo<BulkSelectContextType>(() => {
        const clear = () => setSelection(new Map());

        return {
            count: Array.from(selection.values()).reduce((count, { size }) => count + size, 0),
            enabled,
            selection,
            clear,

            enable: () => setEnabled(true),
            disable: () => {
                setEnabled(false);
                clear();
            },

            unlock: () => (locked.current = false),
            lock: () => {
                locked.current = true;
                return () => (locked.current = false);
            },

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
            if (locked.current) return;
            if (enabled && context.count === 0) context.disable();
            if (event.ctrlKey || event.metaKey) document.removeEventListener('keyup', handleKeyUp);
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (locked.current) return;
            if (!enabled && (event.ctrlKey || event.metaKey)) context.enable();
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

export const useBulkSelect = (): BulkSelectContextType => useContext(BulkSelectContext);
