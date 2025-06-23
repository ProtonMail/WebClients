import type { FC, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import { c } from 'ttag';

import noop from '@proton/utils/noop';

const COPY_PASTE_NODE_WHITELIST = ['input', 'textarea'];

const matchNodeWhiteList = (target: EventTarget | null) => {
    if (!target || !(target instanceof Node)) {
        return false;
    }
    return COPY_PASTE_NODE_WHITELIST.includes(target.nodeName.toLowerCase());
};

export type DesktopContextMenuItem = {
    id?: string;
    label?: string;
    type?: 'normal' | 'submenu' | 'checkbox' | 'radio' | 'separator';
    onSelected?: () => Promise<void> | void;
    role?:
        | 'undo'
        | 'redo'
        | 'cut'
        | 'copy'
        | 'paste'
        | 'pasteAndMatchStyle'
        | 'delete'
        | 'selectAll'
        | 'reload'
        | 'forceReload'
        | 'toggleDevTools'
        | 'resetZoom'
        | 'zoomIn'
        | 'zoomOut'
        | 'toggleSpellChecker'
        | 'togglefullscreen'
        | 'window'
        | 'minimize'
        | 'close'
        | 'help'
        | 'about'
        | 'services'
        | 'hide'
        | 'hideOthers'
        | 'unhide'
        | 'quit'
        | 'startSpeaking'
        | 'stopSpeaking'
        | 'zoom'
        | 'front'
        | 'appMenu'
        | 'fileMenu'
        | 'editMenu'
        | 'viewMenu'
        | 'shareMenu'
        | 'recentDocuments'
        | 'toggleTabBar'
        | 'selectNextTab'
        | 'selectPreviousTab'
        | 'showAllTabs'
        | 'mergeAllWindows'
        | 'clearRecentDocuments'
        | 'moveTabToNewWindow'
        | 'windowMenu';
};

type ClientContextValue = {
    isOpen: (id: string) => boolean;
    open: (id: string) => (e: ReactMouseEvent) => void;
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
export const useContextMenuClose = () => useContextMenu().close;

type Props = {
    children: ReactNode;
    openDesktopContextMenu?: (items: DesktopContextMenuItem[]) => Promise<void>;
};

export const ContextMenuProvider: FC<Props> = ({ children, openDesktopContextMenu }) => {
    const [idOpen, setIdOpen] = useState<string | undefined>(undefined);
    const [position, setPosition] = useState<{ top: number; left: number }>();

    useEffect(() => {
        if (!openDesktopContextMenu) {
            return;
        }

        const genericDesktopContextMenuListener = (event: MouseEvent) => {
            if (!matchNodeWhiteList(event.target)) {
                return;
            }

            openDesktopContextMenu([
                {
                    label: c('Action').t`Cut`,
                    role: 'cut',
                },
                {
                    label: c('Action').t`Copy`,
                    role: 'copy',
                },
                {
                    label: c('Action').t`Paste`,
                    role: 'paste',
                },
            ]).catch(noop);
        };

        document.addEventListener('contextmenu', genericDesktopContextMenuListener);
        return () => document.removeEventListener('contextmenu', genericDesktopContextMenuListener);
    }, []);

    const isOpen = (id: string) => idOpen === id;

    const open = (id: string) => (event: ReactMouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        setIdOpen(id);
        setPosition({ top: event.clientY, left: event.clientX });
    };

    const close = () => {
        setIdOpen(undefined);
    };

    return (
        <ContextMenuContext.Provider value={{ isOpen, open, close, position }}>{children}</ContextMenuContext.Provider>
    );
};
