import React from 'react';
import { TableRow, Checkbox, Time, Icon } from 'react-components';
import { c } from 'ttag';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { LinkType } from '../../interfaces/folder';
import { FileBrowserItem } from './FileBrowser';

interface Props {
    item: FileBrowserItem;
    selectedItems: FileBrowserItem[];
    onToggleSelect: (item: string) => void;
    onClick: (item: string) => void;
    onDoubleClick: (item: string, type: LinkType) => void;
    onShiftClick: (item: string) => void;
}

const ItemRow = ({ item, selectedItems, onToggleSelect, onClick, onDoubleClick, onShiftClick }: Props) => {
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
    const handleRowDoubleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
        e.stopPropagation();
        onDoubleClick(item.LinkID, item.Type);
    };

    const isFolder = item.Type === LinkType.FOLDER;
    const isSelected = selectedItems.some(({ LinkID }) => item.LinkID === LinkID);

    return (
        <TableRow
            className="filebrowser-row"
            onMouseDown={() => document.getSelection()?.removeAllRanges()}
            onClick={handleRowClick}
            onDoubleClick={handleRowDoubleClick}
            cells={[
                <div
                    key="select"
                    style={{ width: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
                >
                    <Checkbox checked={isSelected} onChange={() => onToggleSelect(item.LinkID)} />
                </div>,
                <span key="filename" className="flex flex-items-center">
                    <Icon name={isFolder ? 'folder' : 'file-unknown'} className="mr0-5" />
                    {item.Name}
                </span>,
                isFolder ? c('Label').t`Folder` : c('Label').t`File`,
                <Time key="dateModified">{item.Modified}</Time>,
                typeof item.Size !== 'undefined' && humanSize(item.Size)
            ]}
        />
    );
};

export default ItemRow;
