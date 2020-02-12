import React, { useRef } from 'react';
import { TableRow, Checkbox, Time, Icon, useActiveBreakpoint } from 'react-components';
import { c } from 'ttag';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { ResourceType } from '../../interfaces/folder';
import { FileBrowserItem } from './FileBrowser';

interface Props {
    item: FileBrowserItem;
    selectedItems: FileBrowserItem[];
    onToggleSelect: (item: string) => void;
    onClick: (item: string) => void;
    onDoubleClick: (item: FileBrowserItem) => void;
    onShiftClick: (item: string) => void;
}

const ItemRow = ({ item, selectedItems, onToggleSelect, onClick, onDoubleClick, onShiftClick }: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const touchStarted = useRef(false);

    const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.stopPropagation();
        if (e.shiftKey) {
            onShiftClick(item.LinkID);
        } else if (e.ctrlKey || e.metaKey) {
            onToggleSelect(item.LinkID);
        } else {
            onClick(item.LinkID);
        }
    };

    const handleTouchStart = () => {
        touchStarted.current = true;
    };

    const handleTouchCancel = () => {
        if (touchStarted.current) {
            touchStarted.current = false;
        }
    };

    const handleTouchEnd = () => {
        if (touchStarted.current) {
            onDoubleClick(item);
        }
        touchStarted.current = false;
    };

    const handleRowDoubleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.stopPropagation();
        onDoubleClick(item);
    };

    const isFolder = item.Type === ResourceType.FOLDER;
    const isSelected = selectedItems.some(({ LinkID }) => item.LinkID === LinkID);

    return (
        <TableRow
            className="pd-fb-table-row"
            onMouseDown={() => document.getSelection()?.removeAllRanges()}
            onClick={handleRowClick}
            onDoubleClick={handleRowDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchCancel}
            onTouchCancel={handleTouchCancel}
            onTouchEnd={handleTouchEnd}
            cells={[
                <div key="select" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={isSelected} onChange={() => onToggleSelect(item.LinkID)} />
                </div>,
                <div key="filename" className="flex flex-items-center flex-nowrap">
                    <Icon
                        name={isFolder ? 'folder' : 'drafts'}
                        fill={isFolder ? 'attention' : 'altgrey'}
                        className="mr0-5 flex-item-noshrink"
                        size={25}
                    />
                    <span title={item.Name} className="pd-fb-table-row-name">
                        {item.Name}
                    </span>
                </div>,
                isFolder ? c('Label').t`Folder` : c('Label').t`File`,
                !isNarrow && (
                    <Time key="dateModified" format="PPp">
                        {item.Modified}
                    </Time>
                ),
                item.Size ? humanSize(item.Size) : '-'
            ].filter(Boolean)}
        />
    );
};

export default ItemRow;
