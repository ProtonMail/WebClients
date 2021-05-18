import React, { useRef } from 'react';
import { TableBody, useActiveBreakpoint, Table, classnames, useElementRect, TableCellBusy } from 'react-components';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { buffer } from 'proton-shared/lib/helpers/function';
import { rootFontSize } from 'proton-shared/lib/helpers/dom';
import ItemRow from './ItemRow';
import { FileBrowserProps, FileBrowserItem, DragMoveControls, FileBrowserLayouts } from '../interfaces';
import FolderContextMenu from '../FolderContextMenu';
import useFileBrowserView from '../useFileBrowserView';
import ListHeader from './ListHeader';
import { fileBrowserColumns } from '../constants';

type ListItemData = {
    itemCount: number;
    shareId: string;
    contents: FileBrowserItem[];
    selectedItems: FileBrowserItem[];
    onToggleItemSelected: (item: string) => void;
    selectItem: (item: string) => void;
    onShiftClick?: (item: string) => void;
    onItemClick?: (item: FileBrowserItem) => void;
    loading?: boolean;
    type: FileBrowserLayouts;
    isPreview?: boolean;
    isDesktop?: boolean;
    secondaryActionActive?: boolean;
    getDragMoveControls?: (item: FileBrowserItem) => DragMoveControls;
};
type ListItemRowProps = Omit<ListChildComponentProps, 'data'> & {
    data: ListItemData;
};

const ListItemRow = ({ index, style, data }: ListItemRowProps) => {
    const {
        itemCount,
        loading,
        contents,
        shareId,
        selectedItems,
        onToggleItemSelected,
        onShiftClick,
        onItemClick,
        isPreview,
        type,
        selectItem,
        secondaryActionActive,
        getDragMoveControls,
        isDesktop,
    } = data;

    if (loading && index === itemCount - 1) {
        const colSpan = (type === 'trash' ? 5 : 4) + Number(isDesktop);
        return (
            <tr style={style}>
                <TableCellBusy className="flex text-lg flex-justify-center m0" colSpan={colSpan} />
            </tr>
        );
    }

    const item = contents[index];

    return (
        <ItemRow
            style={style}
            item={item}
            shareId={shareId}
            selectedItems={selectedItems}
            layoutType={type}
            onToggleSelect={onToggleItemSelected}
            onShiftClick={onShiftClick}
            onClick={onItemClick}
            columns={fileBrowserColumns[type]}
            selectItem={selectItem}
            secondaryActionActive={secondaryActionActive}
            dragMoveControls={getDragMoveControls?.(item)}
            isPreview={isPreview}
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
                'file-browser-table simple-table--is-hoverable no-border border-collapse',
                className,
            ])}
        >
            <TableBody>{children}</TableBody>
        </Table>
    );
};

type Props = Omit<FileBrowserProps, 'layout'>;

const ListView = ({
    loading,
    caption,
    contents,
    shareId,
    scrollAreaRef,
    selectedItems,
    type,
    isPreview = false,
    onToggleItemSelected,
    onToggleAllSelected,
    onItemClick,
    selectItem,
    clearSelections,
    onShiftClick,
    sortParams,
    setSorting,
    getDragMoveControls,
}: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rect = useElementRect(containerRef, buffer);

    const {
        secondaryActionActive,
        isContextMenuOpen,
        closeContextMenu,
        contextMenuPosition,
        handleContextMenu,
        openContextMenu,
    } = useFileBrowserView({
        clearSelections,
    });
    const { isDesktop } = useActiveBreakpoint();
    const itemCount = loading ? contents.length + 1 : contents.length;

    const itemHeight = rootFontSize * 2.5; // 2.5 x 16 = we want 40px by default

    // TODO heading padding on scrollbar
    return (
        <div
            role="presentation"
            onContextMenu={handleContextMenu}
            onClick={() => {
                // Close folder context menu
                if (isContextMenuOpen) {
                    closeContextMenu();
                }
                clearSelections();
            }}
            className="flex flex-column flex-item-fluid"
        >
            <div>
                <Table caption={caption} className="file-browser-table m0">
                    <ListHeader
                        contents={contents}
                        onToggleAllSelected={onToggleAllSelected}
                        scrollAreaRef={scrollAreaRef}
                        selectedItems={selectedItems}
                        type={type}
                        setSorting={setSorting}
                        sortParams={sortParams}
                    />
                </Table>
            </div>

            <div className="flex-no-min-children flex-column flex-item-fluid w100 no-scroll" ref={containerRef}>
                {rect && (
                    <FixedSizeList
                        itemCount={itemCount}
                        itemSize={itemHeight}
                        itemData={{
                            isDesktop,
                            itemCount,
                            loading,
                            contents,
                            shareId,
                            selectedItems,
                            onToggleItemSelected,
                            onShiftClick,
                            onItemClick,
                            isPreview,
                            type,
                            selectItem,
                            secondaryActionActive,
                            getDragMoveControls,
                        }}
                        onScroll={() => {
                            if (isContextMenuOpen) {
                                closeContextMenu();
                            }
                        }}
                        width={rect.width}
                        height={rect.height}
                        outerRef={scrollAreaRef}
                        innerElementType={TableBodyRenderer}
                        itemKey={(index, data: ListItemData) =>
                            loading && index === itemCount - 1
                                ? 'loader'
                                : `${data.shareId}/${data.contents[index].LinkID}`
                        }
                    >
                        {ListItemRow}
                    </FixedSizeList>
                )}
            </div>
            {!isPreview && type === 'drive' && (
                <FolderContextMenu
                    isOpen={isContextMenuOpen}
                    open={openContextMenu}
                    close={closeContextMenu}
                    position={contextMenuPosition}
                    anchorRef={scrollAreaRef}
                />
            )}
        </div>
    );
};

export default ListView;
