import React from 'react';
import { Table, TableHeader, TableBody, Checkbox } from 'react-components';
import { c } from 'ttag';
import ItemRow from './ItemRow';
import './FileBrowser.scss';
import { LinkType } from '../../interfaces/folder';
import EmptyFolder from './EmptyFolder';

export interface FileBrowserItem {
    Name: string;
    LinkID: string;
    Type: LinkType;
    Modified: number;
    Size?: number;
}

interface Props {
    loading?: boolean;
    contents?: FileBrowserItem[];
    selectedItems: FileBrowserItem[];
    onToggleItemSelected: (item: string) => void;
    onItemClick: (item: string) => void;
    onItemDoubleClick: (item: string, type: LinkType) => void;
    onShiftClick: (item: string) => void;
    onEmptyAreaClick: () => void;
    onToggleAllSelected: () => void;
}

const FileBrowser = ({
    loading,
    contents,
    selectedItems,
    onToggleItemSelected,
    onToggleAllSelected,
    onItemClick,
    onItemDoubleClick,
    onEmptyAreaClick,
    onShiftClick
}: Props) => {
    if (contents && !contents.length && !loading) {
        return <EmptyFolder />;
    }

    const folderContents = contents ?? [];
    const allSelected = !!folderContents.length && folderContents.length === selectedItems.length;
    const someSelected = !!folderContents.length && !allSelected && !!selectedItems.length;

    return (
        <div className="flex flex-item-fluid" onClick={onEmptyAreaClick}>
            <Table>
                <TableHeader
                    cells={[
                        <div key="select-all" style={{ width: 0 }} onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                                readOnly
                                disabled={!folderContents.length}
                                indeterminate={someSelected}
                                checked={allSelected}
                                onChange={onToggleAllSelected}
                            />
                        </div>,
                        c('TableHeader').t`Name`,
                        c('TableHeader').t`Type`,
                        c('TableHeader').t`Modified`,
                        c('TableHeader').t`Size`
                    ]}
                />
                <TableBody loading={loading} colSpan={5}>
                    {folderContents.map((item) => (
                        <ItemRow
                            key={item.LinkID}
                            item={item}
                            selectedItems={selectedItems}
                            onToggleSelect={onToggleItemSelected}
                            onDoubleClick={onItemDoubleClick}
                            onShiftClick={onShiftClick}
                            onClick={onItemClick}
                        />
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

export default FileBrowser;
