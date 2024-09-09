import { useCallback, useRef } from 'react';

import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import useOnScrollEnd from '../../hooks/util/useOnScrollEnd';
import GridView from './GridView/GridView';
import { ListView } from './ListView/ListView';
import type { BrowserItemId, DragMoveControls, FileBrowserBaseItem, SortParams } from './interface';

export interface FileBrowserProps<T extends FileBrowserBaseItem, T1> {
    caption?: string;
    headerItems: any[];
    items: T[];
    layout: LayoutSetting;
    loading?: boolean;
    isMultiSelectionDisabled?: boolean;
    sortParams?: SortParams<T1>;

    Cells: React.FC<{ item: T }>[];
    GridHeaderComponent?: React.FC<{ scrollAreaRef: React.RefObject<HTMLDivElement> }>;
    GridViewItem?: React.FC<{ item: T }>;

    onItemContextMenu?: (e: any) => void;
    onItemOpen?: (id: BrowserItemId) => void;
    onItemRender?: (item: T) => void;
    onScrollEnd?: () => void;
    onScroll?: () => void;
    onSort?: (params: SortParams<T1>) => void;
    onViewContextMenu?: (e: React.MouseEvent<Element>) => void;

    contextMenuAnchorRef?: React.RefObject<HTMLDivElement>;
    getDragMoveControls?: (item: T) => DragMoveControls;
}

/**
 * File browser that supports grid view and list view
 * If only grid or list view is needed better use them directly
 */
const FileBrowser = <T extends FileBrowserBaseItem, T1>({
    caption = '',
    headerItems = [],
    items = [],
    layout,
    loading = false,
    sortParams,

    isMultiSelectionDisabled,

    Cells = [],
    GridHeaderComponent,
    GridViewItem,

    onItemContextMenu,
    onItemOpen,
    onItemRender,
    onScroll,
    onScrollEnd,
    onSort,
    onViewContextMenu,

    contextMenuAnchorRef,

    getDragMoveControls,
}: FileBrowserProps<T, T1>) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    const handleScrollEnd = useCallback(() => {
        onScrollEnd?.();
    }, [onScrollEnd, layout]);

    // On content change, check scroll end (does not rebind listeners).
    useOnScrollEnd(handleScrollEnd, scrollAreaRef, 0.9, [items, layout]);

    if (layout === LayoutSetting.Grid) {
        if (!GridHeaderComponent || !GridViewItem) {
            throw new Error('Cannot use grid view without grid components');
        }
        return (
            <GridView
                caption={caption}
                items={items}
                loading={loading}
                GridHeaderComponent={GridHeaderComponent}
                GridViewItem={GridViewItem}
                onItemContextMenu={onItemContextMenu}
                onItemOpen={onItemOpen}
                onItemRender={onItemRender}
                onScroll={onScroll}
                onViewContextMenu={onViewContextMenu}
                contextMenuAnchorRef={contextMenuAnchorRef}
                scrollAreaRef={scrollAreaRef}
                getDragMoveControls={getDragMoveControls}
                isMultiSelectionDisabled={isMultiSelectionDisabled}
            />
        );
    }

    return (
        <ListView
            caption={caption}
            items={items}
            headerItems={headerItems}
            loading={loading}
            sortParams={sortParams}
            Cells={Cells}
            onItemContextMenu={onItemContextMenu}
            onItemOpen={onItemOpen}
            onItemRender={onItemRender}
            onScroll={onScroll}
            onSort={onSort}
            onViewContextMenu={onViewContextMenu}
            contextMenuAnchorRef={contextMenuAnchorRef}
            scrollAreaRef={scrollAreaRef}
            getDragMoveControls={getDragMoveControls}
            isMultiSelectionDisabled={isMultiSelectionDisabled}
        />
    );
};

export default FileBrowser;
