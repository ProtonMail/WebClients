import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';

import { useContextMenuControls } from '../hooks/useContextMenuControls';

interface Controls {
    isOpen: boolean;
    handleContextMenu: (e: React.MouseEvent<Element>) => void;
    handleContextMenuTouch: (e: React.TouchEvent<Element>) => void;
    open: () => void;
    close: () => void;
    position:
        | {
              top: number;
              left: number;
          }
        | undefined;
}

const FileBrowserItemContextMenuContext = createContext<Controls | null>(null);

interface Props {
    children: ReactNode;
}

export function FileBrowserItemContextMenuProvider({ children }: Props) {
    const contextMenuControls = useContextMenuControls();

    return (
        <FileBrowserItemContextMenuContext.Provider value={contextMenuControls}>
            {children}
        </FileBrowserItemContextMenuContext.Provider>
    );
}

export function useItemContextMenu() {
    const state = useContext(FileBrowserItemContextMenuContext);
    if (!state) {
        throw new Error('Trying to use uninitialized FileBrowserItemContextMenuProvider');
    }
    return state;
}
