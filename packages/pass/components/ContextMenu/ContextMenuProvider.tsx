import type { FC, MouseEvent, PropsWithChildren } from 'react';
import { createContext, useCallback, useState } from 'react';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { MaybeNull } from '@proton/pass/types';

type ContextMenuState = { id: string; position: { top: number; left: number } };

interface ClientContextValue {
    state: MaybeNull<ContextMenuState>;

    close: () => void;
    /** Passing an `id` will check that the menu is
     * opened for a given menu identifier. Omitting
     * the `id` parameter returns `open` state */
    isOpen: (id?: string) => boolean;
    open: (e: MouseEvent, id: string) => void;
}

const ContextMenuContext = createContext<MaybeNull<ClientContextValue>>(null);

export const useContextMenu = createUseContext(ContextMenuContext);
export const useContextMenuOpen = () => useContextMenu().open;
export const useContextMenuClose = () => useContextMenu().close;

export const ContextMenuProvider: FC<PropsWithChildren> = ({ children }) => {
    const [state, setState] = useState<MaybeNull<ContextMenuState>>(null);

    const isOpen = useCallback(
        (id?: string) => {
            if (id) return state?.id === id;
            return state !== null;
        },
        [state?.id]
    );

    const open = useCallback((event: MouseEvent, id: string) => {
        event.stopPropagation();
        event.preventDefault();
        setState({ id, position: { top: event.clientY, left: event.clientX } });
    }, []);

    const close = useCallback(() => setState(null), []);

    return <ContextMenuContext.Provider value={{ isOpen, open, close, state }}>{children}</ContextMenuContext.Provider>;
};
