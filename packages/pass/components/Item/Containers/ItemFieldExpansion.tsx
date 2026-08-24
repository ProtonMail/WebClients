import { type FC, type PropsWithChildren, createContext, useCallback, useContext, useRef, useState } from 'react';

import type { MaybeNull } from '../../../types';

type ItemFieldExpansionContextValue = {
    get: (key: string) => boolean | undefined;
    set: (key: string, value: boolean) => void;
};

const ItemFieldExpansionContext = createContext<MaybeNull<ItemFieldExpansionContextValue>>(null);

export const ItemFieldExpansionProvider: FC<PropsWithChildren> = ({ children }) => {
    const map = useRef(new Map<string, boolean>());
    const api = useRef<ItemFieldExpansionContextValue>({
        get: (key) => map.current.get(key),
        set: (key, value) => map.current.set(key, value),
    }).current;

    return <ItemFieldExpansionContext.Provider value={api}>{children}</ItemFieldExpansionContext.Provider>;
};

export const useItemFieldExpansion = (key: string, defaultValue: boolean) => {
    const ctx = useContext(ItemFieldExpansionContext);
    const [expanded, setExpandedState] = useState(() => ctx?.get(key) ?? defaultValue);

    /** Re-syncs when `key` changes without the caller remounting — this hook
     * shouldn't depend on the consumer always remounting per key to stay
     * correct. Set during render (not an effect) to avoid an extra render
     * showing the previous item's stale value. */
    const prevKey = useRef(key);
    if (prevKey.current !== key) {
        prevKey.current = key;
        setExpandedState(ctx?.get(key) ?? defaultValue);
    }

    const setExpanded = useCallback(
        (value: boolean) => {
            setExpandedState(value);
            ctx?.set(key, value);
        },
        [ctx, key]
    );

    return [expanded, setExpanded] as const;
};
