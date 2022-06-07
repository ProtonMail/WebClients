import * as React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

import {
    TableBody,
    useActiveBreakpoint,
    Table,
    classnames,
    useElementRect,
    TableCellBusy,
    useRightToLeft,
} from '@proton/components';
import buffer from '@proton/utils/buffer';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';

import { DragMoveControls, FileBrowserBaseItem, BrowserItemId } from '../interface';
import ListHeader from './ListHeader';
import ItemRow from './ItemRow';
import { FileBrowserProps } from '../FileBrowser';
import { useSelection } from '../state/useSelection';

interface ListItemData<T extends FileBrowserBaseItem> {
    items: T[];
    loading: boolean;
    itemCount: number;

    Cells: React.FC<{ item: T }>[];

    onItemContextMenu?: (e: any) => void;
    onItemOpen?: (id: BrowserItemId) => void;
    onItemRender?: (item: T) => void;

    getDragMoveControls?: (item: T) => DragMoveControls;
}

interface ListItemRowProps<T extends FileBrowserBaseItem> extends ListChildComponentProps {
    data: ListItemData<T>;
}

const ListItemRow = <T extends FileBrowserBaseItem>({ index, style, data }: ListItemRowProps<T>) => {
    const {
        items,
        loading,
        itemCount,

        Cells,

        onItemContextMenu,
        onItemOpen,
        onItemRender,

        getDragMoveControls,
    } = data;

    if (loading && index === itemCount - 1) {
        return (
            <tr style={style}>
                <TableCellBusy className="flex text-lg flex-justify-center m0" />
            </tr>
        );
    }

    const item = items[index];

    if (!item) {
        return null;
    }

    return (
        <ItemRow
            style={style}
            item={item}
            Cells={Cells}
            onItemContextMenu={onItemContextMenu}
            onItemOpen={onItemOpen}
            onItemRender={onItemRender}
            dragMoveControls={getDragMoveControls?.(item)}
        />
    );
};

const TableBodyRenderer = ({
    children,
    className,
    ...props
}: React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>) => {
    return (
        <Table
            {...props}
            className={classnames([
                'file-browser-table simple-table--is-hoverable border-none border-collapse',
                className,
            ])}
        >
            <TableBody>{children}</TableBody>
        </Table>
    );
};

type Props<T extends FileBrowserBaseItem, T1> = Omit<
    FileBrowserProps<T, T1>,
    'onScrollEnd' | 'layout' | 'GridHeaderComponent' | 'GridViewItem'
> & {
    scrollAreaRef: React.RefObject<HTMLDivElement>;
};

export const ListView = <T extends FileBrowserBaseItem, T1>({
    caption,
    items,
    headerItems,
    loading = false,
    sortParams,

    Cells,

    onItemContextMenu,
    onItemOpen,
    onItemRender,
    onScroll,
    onViewContextMenu,
    onSort,

    contextMenuAnchorRef,
    scrollAreaRef,

    getDragMoveControls,
}: Props<T, T1>) => {
    const { isDesktop } = useActiveBreakpoint();
    const [isRTL] = useRightToLeft();
    const selectionControls = useSelection();

    const containerRef = React.useRef<HTMLDivElement>(null);
    const rect = useElementRect(containerRef, buffer);

    const itemCount = loading ? items.length + 1 : items.length;
    const itemHeight = rootFontSize * 2.5; // 2.5 x 16 = we want 40px by default

    const itemData = {
        items,
        isDesktop,
        itemCount,
        loading,

        Cells,

        onItemContextMenu,
        onItemOpen,
        onItemRender,

        getDragMoveControls,
    };

    // TODO heading padding on scrollbar
    return (
        <div
            className="flex flex-column flex-item-fluid"
            onClick={selectionControls?.clearSelections}
            onContextMenu={onViewContextMenu}
            ref={containerRef}
            role="presentation"
        >
            <Table caption={caption} className="file-browser-table m0">
                <ListHeader
                    scrollAreaRef={scrollAreaRef}
                    items={headerItems}
                    isLoading={loading}
                    itemCount={items.length}
                    onSort={onSort}
                    sortParams={sortParams}
                />
            </Table>

            <div className="flex-no-min-children flex-column flex-item-fluid w100 no-scroll" ref={contextMenuAnchorRef}>
                {rect && (
                    <FixedSizeList
                        direction={isRTL ? 'rtl' : 'ltr'}
                        itemCount={itemCount}
                        itemSize={itemHeight}
                        // @ts-ignore
                        // TODO: explanatory comment
                        itemData={itemData}
                        onScroll={onScroll}
                        width={rect.width}
                        height={rect.height}
                        outerRef={scrollAreaRef}
                        innerElementType={TableBodyRenderer}
                        itemKey={(index, data) =>
                            loading && index === itemCount - 1 ? 'loader' : `${data.items[index].id}`
                        }
                    >
                        {ListItemRow}
                    </FixedSizeList>
                )}
            </div>
        </div>
    );
};
