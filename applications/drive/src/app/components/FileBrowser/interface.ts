import { VERIFICATION_STATUS } from 'pmcrypto';
import React from 'react';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { LinkShareUrl } from '../../store';

export interface DragMoveControls {
    handleDragOver: (event: React.DragEvent<HTMLTableRowElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLTableRowElement>) => void;
    handleDragLeave: () => void;
    handleDragEnter: (e: React.DragEvent<HTMLTableRowElement>) => void;
    dragging: boolean;
    setDragging: (value: boolean) => void;
    isActiveDropTarget: boolean;
}

export interface FileBrowserItem {
    name: string;
    linkId: string;
    isFile: boolean;
    createTime: number;
    fileModifyTime: number;
    trashed: number | null;
    mimeType: string;
    size: number;
    activeRevision?: {
        id: string;
        size: number;
    };
    parentLinkId: string;
    location?: string;
    isLocked?: boolean;
    shareId?: string;
    shareUrl?: LinkShareUrl;
    hasThumbnail: boolean;
    // CachedThumbnailURL is computed URL to cached image. This is not part
    // of any request and not filled automatically. To get this value, use
    // `loadLinkThumbnail` from `useDrive`.
    cachedThumbnailUrl?: string;
    signatureAddress?: string;
    signatureIssues?: {
        [location: string]: VERIFICATION_STATUS;
    };
}

export type ItemRowColumns =
    | 'location'
    | 'original_location'
    | 'uploaded'
    | 'modified'
    | 'share_created'
    | 'share_expires'
    | 'share_num_access'
    | 'share_options'
    | 'size'
    | 'trashed';
export type FileBrowserLayouts = 'trash' | 'sharing' | 'drive' | 'search';

export interface ItemProps {
    style?: React.CSSProperties;
    item: FileBrowserItem;
    shareId: string;
    selectedItems: FileBrowserItem[];
    onToggleSelect: (item: string) => void;
    selectItem: (item: string) => void;
    onShiftClick?: (item: string) => void;
    onClick?: (item: FileBrowserItem) => void;
    columns: ItemRowColumns[];
    dragMoveControls?: DragMoveControls;
    isPreview?: boolean;
    ItemContextMenu?: React.FunctionComponent<ContextMenuProps>;
    FolderContextMenu?: React.FunctionComponent<ContextMenuProps>;
}

export interface FileBrowserProps<T extends SortField = SortField> {
    layout: LayoutSetting;
    loading?: boolean;
    shareId: string;
    caption?: string;
    contents: FileBrowserItem[];
    selectedItems: FileBrowserItem[];
    type: FileBrowserLayouts;
    isPreview?: boolean;
    sortFields?: T[];
    sortParams?: SortParams<T>;
    onScrollEnd?: () => void;
    onToggleItemSelected: (item: string) => void;
    onItemClick?: (item: FileBrowserItem) => void;
    onShiftClick?: (item: string) => void;
    selectItem: (item: string) => void;
    clearSelections: () => void;
    onToggleAllSelected: () => void;
    setSorting?: (sortParams: SortParams<T>) => void;
    getDragMoveControls?: (item: FileBrowserItem) => DragMoveControls;
    ItemContextMenu?: React.FunctionComponent<ContextMenuProps>;
    FolderContextMenu?: React.FunctionComponent<ContextMenuProps>;
}

export type FolderSortField = 'name' | 'mimeType' | 'fileModifyTime' | 'size';
export type PublicFolderSortField = 'name' | 'size';
export type SharedLinkSortField = 'name' | 'linkCreateTime' | 'linkExpireTime' | 'numAccesses';
export type TrashedLinksSortField = 'name' | 'size' | 'trashed';
export type SearchSortField = 'name' | 'fileModifyTime' | 'size';
export type SortField =
    | FolderSortField
    | PublicFolderSortField
    | SharedLinkSortField
    | TrashedLinksSortField
    | 'metaDataModifyTime';

export interface SortParams<T extends SortField = SortField> {
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
