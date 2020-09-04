import React from 'react';
import { TableBody, TableRowBusy, useActiveBreakpoint } from 'react-components';
import ItemRow from './ItemRow';
import { FileBrowserProps } from '../interfaces';
import FolderContextMenu from '../FolderContextMenu';
import useFileBrowserView from '../useFileBrowserView';
import ListHeader from './ListHeader';

type Props = Omit<FileBrowserProps, 'view'>;

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
    const colSpan = 4 + Number(isDesktop) + Number(isTrash);

    return (
        <div
            ref={scrollAreaRef}
            role="presentation"
            onScroll={() => {
                if (isContextMenuOpen) {
                    closeContextMenu();
                }
            }}
            onContextMenu={handleContextMenu}
            onClick={() => {
                // Close folder context menu
                if (isContextMenuOpen) {
                    closeContextMenu();
                }
                clearSelections();
            }}
            className="flex-noMinChildren flex-item-fluid scroll-if-needed"
        >
            <div>
                <table className="pm-simple-table pm-simple-table--isHoverable pd-fb-table noborder border-collapse">
                    <caption className="sr-only">{caption}</caption>
                    <ListHeader
                        contents={contents}
                        onToggleAllSelected={onToggleAllSelected}
                        scrollAreaRef={scrollAreaRef}
                        selectedItems={selectedItems}
                        isTrash={isTrash}
                        setSorting={setSorting}
                        sortParams={sortParams}
                    />
                    <TableBody colSpan={colSpan}>
                        {contents.map((item) => (
                            <ItemRow
                                key={item.LinkID}
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
                        ))}
                        {loading && <TableRowBusy colSpan={colSpan} />}
                    </TableBody>
                </table>
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
        </div>
    );
};

export default ListView;
