import React from 'react';
import { TableBody, Checkbox } from 'react-components';
import { c } from 'ttag';
import ItemRow from './ItemRow';
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
    onItemDoubleClick: (item: FileBrowserItem) => void;
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

    return (
        <div className="flex flex-item-fluid" onClick={onEmptyAreaClick}>
            <table className="pd-fb-table w100 noborder min-w35e">
                <thead>
                    <tr>
                        <th>
                            <div key="select-all" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    readOnly
                                    disabled={!folderContents.length}
                                    checked={allSelected}
                                    onChange={onToggleAllSelected}
                                />
                            </div>
                        </th>
                        <th className="w50">
                            <div className="pd-fb-table-heading-name ml0-5">{c('TableHeader').t`Name`}</div>
                        </th>
                        <th className="w15">{c('TableHeader').t`Type`}</th>
                        <th className="w20">{c('TableHeader').t`Modified`}</th>
                        <th className="w15">{c('TableHeader').t`Size`}</th>
                    </tr>
                </thead>
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
            </table>
        </div>
    );
};

export default FileBrowser;
