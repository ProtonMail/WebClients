import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { LinkType, SortParams, SortKeys, SharedUrlInfo } from '../../interfaces/link';
import { LayoutSetting } from '../../interfaces/userSettings';

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
    Trashed: number | null;
    MIMEType: string;
    Size: number;
    ParentLinkID: string;
    Location?: string;
    Disabled?: boolean;
    UrlsExpired: boolean;
    ShareUrlShareID?: string;
    SharedUrl?: SharedUrlInfo;
}

export type ItemRowColumns =
    | 'type'
    | 'location'
    | 'share_created'
    | 'share_num_access'
    | 'share_expires'
    | 'modified'
    | 'size';
export type FileBrowserLayouts = 'trash' | 'sharing' | 'drive';

export interface ItemProps {
    style?: React.CSSProperties;
    item: FileBrowserItem;
    shareId: string;
    layoutType: FileBrowserLayouts;
    selectedItems: FileBrowserItem[];
    onToggleSelect: (item: string) => void;
    selectItem: (item: string) => void;
    onShiftClick?: (item: string) => void;
    onClick?: (item: FileBrowserItem) => void;
    columns: ItemRowColumns[];
    secondaryActionActive?: boolean;
    dragMoveControls?: DragMoveControls;
    isPreview?: boolean;
}

export interface FileBrowserProps {
    layout: LayoutSetting;
    loading?: boolean;
    scrollAreaRef: React.RefObject<HTMLDivElement>;
    shareId: string;
    caption?: string;
    contents: FileBrowserItem[];
    selectedItems: FileBrowserItem[];
    type: FileBrowserLayouts;
    isPreview?: boolean;
    sortParams?: SortParams;
    onToggleItemSelected: (item: string) => void;
    onItemClick?: (item: FileBrowserItem) => void;
    onShiftClick?: (item: string) => void;
    selectItem: (item: string) => void;
    clearSelections: () => void;
    onToggleAllSelected: () => void;
    setSorting?: (sortField: SortKeys, sortOrder: SORT_DIRECTION) => void;
    getDragMoveControls?: (item: FileBrowserItem) => DragMoveControls;
}
