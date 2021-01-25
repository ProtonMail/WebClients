import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { LinkType, SortParams, SortKeys } from '../../interfaces/link';
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
    SharedURLShareID?: string;
    UrlsExpired: boolean;
}

export interface ItemProps {
    style?: React.CSSProperties;
    item: FileBrowserItem;
    shareId: string;
    selectedItems: FileBrowserItem[];
    onToggleSelect: (item: string) => void;
    selectItem: (item: string) => void;
    onShiftClick?: (item: string) => void;
    onClick?: (item: FileBrowserItem) => void;
    showLocation?: boolean;
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
    isTrash?: boolean;
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
