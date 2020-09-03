import React from 'react';
import { c } from 'ttag';
import {
    TableBody,
    Checkbox,
    TableRowBusy,
    useActiveBreakpoint,
    TableRowSticky,
    TableHeaderCell,
} from 'react-components';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import ItemRow from './ItemRow';
import { FileBrowserProps } from '../interfaces';
import FolderContextMenu from '../FolderContextMenu';
import { SortKeys } from '../../../interfaces/link';
import useFileBrowserView from '../useFileBrowserView';

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
    const unlessIsTrash = (fn?: () => void) => (isTrash ? undefined : fn);

    const handleSort = (key: SortKeys) => {
        if (!sortParams || !setSorting) {
            return;
        }

        const direction =
            sortParams.sortField === key && sortParams.sortOrder === SORT_DIRECTION.DESC
                ? SORT_DIRECTION.ASC
                : SORT_DIRECTION.DESC;

        setSorting(key, direction);
    };

    const getSortDirectionForKey = (key: SortKeys) =>
        sortParams?.sortField === key ? sortParams.sortOrder : undefined;

    const allSelected = !!contents.length && contents.length === selectedItems.length;
    const modifiedHeader = isTrash ? c('TableHeader').t`Deleted` : c('TableHeader').t`Modified`;
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
                    <thead onContextMenu={(e) => e.stopPropagation()}>
                        <TableRowSticky scrollAreaRef={scrollAreaRef}>
                            <TableHeaderCell>
                                <div
                                    role="presentation"
                                    key="select-all"
                                    className="flex"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Checkbox
                                        className="increase-surface-click"
                                        disabled={!contents.length}
                                        checked={allSelected}
                                        onChange={onToggleAllSelected}
                                    />
                                </div>
                            </TableHeaderCell>
                            <TableHeaderCell>
                                <div className="ellipsis">{c('TableHeader').t`Name`}</div>
                            </TableHeaderCell>
                            {isTrash && (
                                <TableHeaderCell className="w25">{c('TableHeader').t`Location`}</TableHeaderCell>
                            )}
                            <TableHeaderCell
                                direction={getSortDirectionForKey('MIMEType')}
                                onSort={unlessIsTrash(() => handleSort('MIMEType'))}
                                className={isDesktop ? 'w20' : 'w25'}
                            >
                                {c('TableHeader').t`Type`}
                            </TableHeaderCell>
                            {isDesktop && (
                                <TableHeaderCell
                                    direction={getSortDirectionForKey('ModifyTime')}
                                    onSort={unlessIsTrash(() => handleSort('ModifyTime'))}
                                >
                                    {modifiedHeader}
                                </TableHeaderCell>
                            )}
                            <TableHeaderCell
                                direction={getSortDirectionForKey('Size')}
                                onSort={unlessIsTrash(() => handleSort('Size'))}
                                className={isDesktop ? 'w10' : 'w15'}
                            >
                                {c('TableHeader').t`Size`}
                            </TableHeaderCell>
                        </TableRowSticky>
                    </thead>
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
