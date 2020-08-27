import React, { useEffect, useState, useCallback } from 'react';
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
import { DragMoveControls } from '../../hooks/drive/useDriveDragMove';
import { FileBrowserItem } from './interfaces';
import FolderContextMenu from './FolderContextMenu';
import { SortKeys, SortParams } from '../../interfaces/link';

interface Props {
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

const FileBrowser = ({
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
    const [secondaryActionActive, setSecondaryActionActive] = useState(false);
    const [isContextMenuOpen, setIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const { isDesktop } = useActiveBreakpoint();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const newSecondaryActionIsActive = e.shiftKey || e.metaKey || e.ctrlKey;
            if (newSecondaryActionIsActive !== secondaryActionActive) {
                setSecondaryActionActive(newSecondaryActionIsActive);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyDown);
        };
    }, [secondaryActionActive]);

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

    const openContextMenu = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeContextMenu = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isTrash) {
            return;
        }

        e.stopPropagation();
        e.preventDefault();

        clearSelections();

        if (isContextMenuOpen) {
            closeContextMenu();
        }

        setContextMenuPosition({ top: e.clientY, left: e.clientX });
    };

    const allSelected = !!contents.length && contents.length === selectedItems.length;
    const modifiedHeader = isTrash ? c('TableHeader').t`Deleted` : c('TableHeader').t`Modified`;
    const colSpan = 4 + Number(isDesktop) + Number(isTrash);

    return (
        <div
            ref={scrollAreaRef}
            role="presentation"
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

export default FileBrowser;
