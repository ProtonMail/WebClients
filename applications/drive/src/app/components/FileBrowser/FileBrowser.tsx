import React from 'react';
import { TableBody, Checkbox, TableRowBusy, useActiveBreakpoint } from 'react-components';
import { c } from 'ttag';
import ItemRow from './ItemRow';
import { ResourceType } from '../../interfaces/link';

export interface FileBrowserItem {
    Name: string;
    LinkID: string;
    Type: ResourceType;
    Modified: number;
    MimeType: string;
    Size: number;
    ParentLinkID: string;
}

interface Props {
    loading?: boolean;
    contents: FileBrowserItem[];
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
    const { isNarrow } = useActiveBreakpoint();

    const allSelected = !!contents.length && contents.length === selectedItems.length;

    return (
        <div className="flex flex-item-fluid" onClick={onEmptyAreaClick}>
            <table className="pd-fb-table">
                <thead>
                    <tr>
                        <th>
                            <div key="select-all" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    readOnly
                                    disabled={!contents.length}
                                    checked={allSelected}
                                    onChange={onToggleAllSelected}
                                />
                            </div>
                        </th>
                        <th>
                            <div className="pd-fb-table-heading-name ml0-5">{c('TableHeader').t`Name`}</div>
                        </th>
                        <th className={isNarrow ? 'w15' : 'w10'}>{c('TableHeader').t`Type`}</th>
                        {!isNarrow && <th className="w20">{c('TableHeader').t`Modified`}</th>}
                        <th className={isNarrow ? 'w15' : 'w10'}>{c('TableHeader').t`Size`}</th>
                    </tr>
                </thead>
                <TableBody colSpan={isNarrow ? 4 : 5}>
                    {contents.map((item) => (
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
                    {loading && <TableRowBusy colSpan={isNarrow ? 4 : 5} />}
                </TableBody>
            </table>
        </div>
    );
};

export default FileBrowser;
