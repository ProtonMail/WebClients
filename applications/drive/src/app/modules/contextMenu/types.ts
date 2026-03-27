import type React from 'react';

export interface ContextMenuPosition {
    top: number;
    left: number;
}

export type ContextMenuType = 'view' | 'item';

export interface ContextMenuStore {
    isOpen: boolean;
    position: ContextMenuPosition | undefined;
    lastCloseTime: number | undefined;
    type: ContextMenuType;

    open: () => void;
    close: () => void;
    handleContextMenu: (e: React.MouseEvent<Element>, type?: ContextMenuType) => void;
    handleContextMenuTouch: (e: React.TouchEvent<Element>, type?: ContextMenuType) => void;
}
