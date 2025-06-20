import type { MouseEvent } from 'react';
import { type FC, type PropsWithChildren, createContext, useContext, useState } from 'react';

import noop from '@proton/utils/noop';

type ClientContextValue = {
    isOpen: (id: string) => boolean;
    open: (id: string) => (e: MouseEvent) => void;
    close: () => void;
    position: { top: number; left: number } | undefined;
};

const ContextMenuContext = createContext<ClientContextValue>({
    isOpen: () => false,
    open: () => noop,
    close: noop,
    position: undefined,
});

export const useContextMenu = () => useContext(ContextMenuContext);
export const useContextMenuOpen = (id: string) => useContextMenu().open(id);

export const ContextMenuProvider: FC<PropsWithChildren> = ({ children }) => {
    const [idOpen, setIdOpen] = useState<string | undefined>(undefined);
    const [position, setPosition] = useState<{ top: number; left: number }>();

    // useEffect(() => {
    //     document.addEventListener('contextmenu', (event) => {
    //         if ((event.target as any).nodeName !== 'INPUT') return;
    //
    //         openContextMenu([
    //             {
    //                 label: c('Action').t`Cut`,
    //                 onSelected: () => {
    //                     document.execCommand('cut');
    //                 },
    //             },
    //             {
    //                 label: c('Action').t`Copy`,
    //                 onSelected: () => {
    //                     document.execCommand('copy');
    //                 },
    //             },
    //             {
    //                 label: c('Action').t`Paste`,
    //                 onSelected: () => {
    //                     document.execCommand('paste');
    //                 },
    //             },
    //         ]).catch(noop);
    //     });
    // }, []);

    const isOpen = (id: string) => idOpen === id;

    const open = (id: string) => (e: MouseEvent) => {
        setIdOpen(id);
        setPosition({ top: e.clientY, left: e.clientX });
    };

    const close = () => {
        setIdOpen(undefined);
    };

    return (
        <ContextMenuContext.Provider value={{ isOpen, open, close, position }}>{children}</ContextMenuContext.Provider>
    );
};
