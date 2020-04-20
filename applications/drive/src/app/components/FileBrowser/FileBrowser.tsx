import React from 'react';
import { TableBody, Checkbox, TableRowBusy, useActiveBreakpoint } from 'react-components';
import { c } from 'ttag';
import ItemRow from './ItemRow';
import { LinkType } from '../../interfaces/link';

export interface FileBrowserItem {
    Name: string;
    LinkID: string;
    Type: LinkType;
    Modified: number;
    MimeType: string;
    Size: number;
    ParentLinkID: string;
    Location?: string;
}

interface Props {
    loading?: boolean;
    shareId: string;
    contents: FileBrowserItem[];
    selectedItems: FileBrowserItem[];
    isTrash?: boolean;
    onToggleItemSelected: (item: string) => void;
    onItemClick?: (item: FileBrowserItem) => void;
    onShiftClick: (item: string) => void;
    onEmptyAreaClick: () => void;
    onToggleAllSelected: () => void;
}

const FileBrowser = ({
    loading,
    contents,
    shareId,
    selectedItems,
    isTrash = false,
    onToggleItemSelected,
    onToggleAllSelected,
    onItemClick,
    onEmptyAreaClick,
    onShiftClick
}: Props) => {
    const { isDesktop } = useActiveBreakpoint();

    const allSelected = !!contents.length && contents.length === selectedItems.length;
    const modifiedHeader = isTrash ? c('TableHeader').t`Deleted` : c('TableHeader').t`Modified`;
    const colSpan = 4 + Number(isDesktop) + Number(isTrash);

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
                        {isTrash && <th className="w25">{c('TableHeader').t`Location`}</th>}
                        <th className={isDesktop ? 'w10' : 'w15'}>{c('TableHeader').t`Type`}</th>
                        {isDesktop && <th className="w20">{modifiedHeader}</th>}
                        <th className={isDesktop ? 'w10' : 'w15'}>{c('TableHeader').t`Size`}</th>
                    </tr>
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
                        />
                    ))}
                    {loading && <TableRowBusy colSpan={colSpan} />}
                </TableBody>
            </table>
        </div>
    );
};

export default FileBrowser;
