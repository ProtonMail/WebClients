import React, { useEffect, useState, useCallback } from 'react';
import { c } from 'ttag';

import { TableBody, Checkbox, TableRowBusy, useActiveBreakpoint, TableRowSticky, TableCell } from 'react-components';

import ItemRow from './ItemRow';
import useDriveDragMove from '../../hooks/drive/useDriveDragMove';
import { FileBrowserItem } from './interfaces';
import FolderContextMenu from './FolderContextMenu';

interface Props {
    loading?: boolean;
    scrollAreaRef: React.RefObject<HTMLDivElement>;
    shareId: string;
    caption?: string;
    contents: FileBrowserItem[];
    selectedItems: FileBrowserItem[];
    isTrash?: boolean;
    onToggleItemSelected: (item: string) => void;
    onItemClick?: (item: FileBrowserItem) => void;
    onShiftClick: (item: string) => void;
    selectItem: (item: string) => void;
    clearSelections: () => void;
    onToggleAllSelected: () => void;
}

const FileBrowser = ({
    loading,
    caption,
    contents,
    shareId,
    scrollAreaRef,
    selectedItems,
    isTrash = false,
    onToggleItemSelected,
    onToggleAllSelected,
    onItemClick,
    selectItem,
    clearSelections,
    onShiftClick,
}: Props) => {
    const [secondaryActionActive, setSecondaryActionActive] = useState(false);
    const [isContextMenuOpen, setIsOpen] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState<{ top: number; left: number }>();
    const { isDesktop } = useActiveBreakpoint();
    const getDragMoveControls = useDriveDragMove(shareId, selectedItems, clearSelections);

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
            role="presentation"
            ref={scrollAreaRef}
            className="flex flex-item-fluid scroll-if-needed"
            onClick={() => {
                // Close folder context menu
                if (isContextMenuOpen) {
                    closeContextMenu();
                }
                clearSelections();
            }}
            onContextMenu={handleContextMenu}
        >
            <table className="pm-simple-table pm-simple-table--isHoverable pd-fb-table noborder border-collapse">
                <caption className="sr-only">{caption}</caption>
                <thead onContextMenu={(e) => e.stopPropagation()}>
                    <TableRowSticky scrollAreaRef={scrollAreaRef}>
                        <TableCell type="header" scope="col">
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
                        </TableCell>
                        <TableCell type="header" scope="col">
                            <div className="ellipsis">{c('TableHeader').t`Name`}</div>
                        </TableCell>
                        {isTrash && (
                            <TableCell type="header" scope="col" className="w25">{c('TableHeader')
                                .t`Location`}</TableCell>
                        )}
                        <TableCell type="header" scope="col" className={isDesktop ? 'w10' : 'w15'}>{c('TableHeader')
                            .t`Type`}</TableCell>
                        {isDesktop && (
                            <TableCell type="header" scope="col" className="w20">
                                {modifiedHeader}
                            </TableCell>
                        )}
                        <TableCell type="header" scope="col" className={isDesktop ? 'w10' : 'w15'}>
                            {c('TableHeader').t`Size`}
                        </TableCell>
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
                            dragMoveControls={isTrash ? undefined : getDragMoveControls(item)}
                        />
                    ))}
                    {loading && <TableRowBusy colSpan={colSpan} />}
                </TableBody>
            </table>
            {!isTrash && (
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

export default FileBrowser;
