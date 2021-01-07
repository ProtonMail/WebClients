import React, { useRef } from 'react';
import { TableBody, useActiveBreakpoint, Table, classnames, useElementRect } from 'react-components';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { buffer } from 'proton-shared/lib/helpers/function';
import ItemRow from './ItemRow';
import { FileBrowserProps, FileBrowserItem, DragMoveControls } from '../interfaces';
import FolderContextMenu from '../FolderContextMenu';
import useFileBrowserView from '../useFileBrowserView';
import ListHeader from './ListHeader';

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
    isTrash?: boolean;
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
        isTrash,
        selectItem,
        secondaryActionActive,
        getDragMoveControls,
        isDesktop,
    } = data;

    if (loading && index === itemCount - 1) {
        const colSpan = 4 + Number(isDesktop) + Number(isTrash);
        return (
            <tr aria-busy="true" style={style} className="w100">
                <td colSpan={colSpan} className="m0 flex" />
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
            onToggleSelect={onToggleItemSelected}
            onShiftClick={onShiftClick}
            onClick={onItemClick}
            showLocation={isTrash}
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
            className={classnames(['pd-fb-table pm-simple-table--isHoverable noborder border-collapse', className])}
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
    isTrash = false,
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
                <Table caption={caption} className="pd-fb-table m0">
                    <ListHeader
                        contents={contents}
                        onToggleAllSelected={onToggleAllSelected}
                        scrollAreaRef={scrollAreaRef}
                        selectedItems={selectedItems}
                        isTrash={isTrash}
                        setSorting={setSorting}
                        sortParams={sortParams}
                    />
                </Table>
            </div>

            <div className="flex-noMinChildren flex-column flex-item-fluid w100 no-scroll" ref={containerRef}>
                {rect && (
                    <FixedSizeList
                        itemCount={itemCount}
                        itemSize={40}
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
                            isTrash,
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
            {!isPreview && !isTrash && (
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
