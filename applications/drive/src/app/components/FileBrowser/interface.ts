import React from 'react';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';

export interface DragMoveControls {
    handleDragOver: (event: React.DragEvent<HTMLTableRowElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLTableRowElement>) => void;
    handleDragLeave: () => void;
    handleDragEnter: (e: React.DragEvent<HTMLTableRowElement>) => void;
    dragging: boolean;
    setDragging: (value: boolean) => void;
    isActiveDropTarget: boolean;
    selectedItems: FileBrowserBaseItem[];
}

// export type FolderSortField = 'name' | 'mimeType' | 'fileModifyTime' | 'size';
// export type PublicFolderSortField = 'name' | 'size';
// export type SharedLinkSortField = 'name' | 'linkCreateTime' | 'linkExpireTime' | 'numAccesses';
// export type TrashedLinksSortField = 'name' | 'size' | 'trashed';
// export type SearchSortField = 'name' | 'fileModifyTime' | 'size';
// export type SortField =
//     | FolderSortField
//     | PublicFolderSortField
//     | SharedLinkSortField
//     | TrashedLinksSortField
//     | 'metaDataModifyTime';

export interface SortParams<T> {
    sortField: T;
    sortOrder: SORT_DIRECTION;
}

export interface ContextMenuProps {
    anchorRef: React.RefObject<HTMLElement>;
    children?: React.ReactNode;
    isOpen: boolean;
    position:
        | {
              top: number;
              left: number;
          }
        | undefined;
    open: () => void;
    close: () => void;
}

export interface FileBrowserBaseItem {
    id: string;
    isLocked?: boolean;
}

export enum HeaderCellsPresets {
    Checkbox,
    Placeholder,
}

export interface ListViewHeaderItem {
    type: string | HeaderCellsPresets;
    text?: string;
    props?: React.HTMLProps<HTMLDivElement>;
    sorting?: boolean;
}

export type BrowserItemId = string;
