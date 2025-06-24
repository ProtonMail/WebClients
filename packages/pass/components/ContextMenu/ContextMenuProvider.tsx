import type { FC, MouseEvent, PropsWithChildren } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';

import type { Maybe } from '@proton/pass/types';

type ClientContextValue = {
    isOpen: (id: Maybe<string>) => boolean;
    open: (e: MouseEvent, id: string) => void;
    close: () => void;
    position: { top: number; left: number } | undefined;
};

const ContextMenuContext = createContext<Maybe<ClientContextValue>>(undefined);

export const useContextMenu = () => {
    const context = useContext(ContextMenuContext);
    if (!context) {
        throw new Error('useContextMenu must be used within a ContextMenuProvider');
    }
    return context;
};

export const useContextMenuOpen = () => useContextMenu().open;
export const useContextMenuClose = () => useContextMenu().close;

export const ContextMenuProvider: FC<PropsWithChildren> = ({ children }) => {
    const [contextMenu, setContextMenu] = useState<
        Maybe<{
            id: string;
            position: { top: number; left: number };
        }>
    >(undefined);

    const isOpen = useCallback((id: Maybe<string>) => contextMenu?.id === id, [contextMenu?.id]);

    const open = useCallback((event: MouseEvent, id: string) => {
        event.stopPropagation();
        event.preventDefault();
        setContextMenu({ id, position: { top: event.clientY, left: event.clientX } });
    }, []);

    const close = useCallback(() => {
        setContextMenu(undefined);
    }, []);

    return (
        <ContextMenuContext.Provider value={{ isOpen, open, close, position: contextMenu?.position }}>
            {children}
        </ContextMenuContext.Provider>
    );
};
