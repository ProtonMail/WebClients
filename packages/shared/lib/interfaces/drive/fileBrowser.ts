import React from 'react';
import { LinkType, SortParams, SharedUrlInfo, AllSortKeys } from './link';

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
    Name: string;
    LinkID: string;
    Type: LinkType;
    ModifyTime: number;
    RealModifyTime: number;
    Trashed: number | null;
    MIMEType: string;
    Size: number;
    ActiveRevisionSize?: number;
    ParentLinkID: string;
    Location?: string;
    Disabled?: boolean;
    UrlsExpired: boolean;
    ShareUrlShareID?: string;
    SharedUrl?: SharedUrlInfo;
    HasThumbnail: boolean;
    // CachedThumbnailURL is computed URL to cached image. This is not part
    // of any request and not filled automatically. To get this value, use
    // `loadLinkThumbnail` from `useDrive`.
    CachedThumbnailURL?: string;
}

export type ItemRowColumns =
    | 'location'
    | 'uploaded'
    | 'modified'
    | 'share_created'
    | 'share_expires'
    | 'share_num_access'
    | 'size'
    | 'trashed'
    | 'type';
export type FileBrowserLayouts = 'trash' | 'sharing' | 'drive';

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
    secondaryActionActive?: boolean;
    dragMoveControls?: DragMoveControls;
    isPreview?: boolean;
    ItemContextMenu?: React.FunctionComponent<ItemContextMenuProps>;
    FolderContextMenu?: React.FunctionComponent<FolderContextMenuProps>;
}

export interface FileBrowserProps<T extends AllSortKeys = AllSortKeys> {
    loading?: boolean;
    shareId: string;
    caption?: string;
    contents: FileBrowserItem[];
    selectedItems: FileBrowserItem[];
    type: FileBrowserLayouts;
    isPreview?: boolean;
    sortParams?: SortParams<T>;
    onScrollEnd: () => void;
    onToggleItemSelected: (item: string) => void;
    onItemClick?: (item: FileBrowserItem) => void;
    onShiftClick?: (item: string) => void;
    selectItem: (item: string) => void;
    clearSelections: () => void;
    onToggleAllSelected: () => void;
    setSorting?: (sortParams: SortParams<T>) => void;
    getDragMoveControls?: (item: FileBrowserItem) => DragMoveControls;
    ItemContextMenu?: React.FunctionComponent<ItemContextMenuProps>;
    FolderContextMenu?: React.FunctionComponent<FolderContextMenuProps>;
}

export interface FolderContextMenuProps {
    anchorRef: React.RefObject<HTMLElement>;
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

export interface ItemContextMenuProps extends FolderContextMenuProps {
    shareId: string;
    item: FileBrowserItem;
    selectedItems: FileBrowserItem[];
}
