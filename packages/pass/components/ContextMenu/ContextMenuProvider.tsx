import type { FC, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { c } from 'ttag';

import type { Maybe } from '@proton/pass/types';
import noop from '@proton/utils/noop';

const COPY_PASTE_NODE_WHITELIST = ['INPUT', 'TEXTAREA'];

const matchNodeWhiteList = (target: EventTarget | null) => {
    if (!target || !(target instanceof Node)) {
        return false;
    }
    return COPY_PASTE_NODE_WHITELIST.includes(target.nodeName);
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
    isOpen: (id: Maybe<string>) => boolean;
    open: (e: ReactMouseEvent, id: string) => void;
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

type Props = {
    children: ReactNode;
    openDesktopContextMenu?: (items: DesktopContextMenuItem[]) => Promise<void>;
};

export const ContextMenuProvider: FC<Props> = ({ children, openDesktopContextMenu }) => {
    const [contextMenu, setContextMenu] = useState<
        Maybe<{
            id: string;
            position: { top: number; left: number };
        }>
    >(undefined);

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

    const isOpen = useCallback((id: Maybe<string>) => contextMenu?.id === id, [contextMenu?.id]);

    const open = useCallback((event: ReactMouseEvent, id: string) => {
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
