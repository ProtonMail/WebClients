import type React from 'react';

export interface ContextMenuPosition {
    top: number;
    left: number;
}

export interface ContextMenuStore {
    isOpen: boolean;
    position: ContextMenuPosition | undefined;
    lastCloseTime: number | undefined;

    open: () => void;
    close: () => void;
    handleContextMenu: (e: React.MouseEvent<Element>) => void;
    handleContextMenuTouch: (e: React.TouchEvent<Element>) => void;
}
