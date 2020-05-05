import React, { useRef } from 'react';
import { TableBody, Checkbox, TableRowBusy, useActiveBreakpoint, TableRowSticky } from 'react-components';
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
    caption: string;
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
    caption,
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
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const { isDesktop } = useActiveBreakpoint();

    const allSelected = !!contents.length && contents.length === selectedItems.length;
    const modifiedHeader = isTrash ? c('TableHeader').t`Deleted` : c('TableHeader').t`Modified`;
    const colSpan = 4 + Number(isDesktop) + Number(isTrash);

    return (
        <div ref={scrollAreaRef} className="flex flex-item-fluid scroll-if-needed" onClick={onEmptyAreaClick}>
            <table className="pm-simple-table pm-simple-table--isHoverable pd-fb-table noborder border-collapse">
                <caption className="sr-only">{caption}</caption>
                <thead>
                    <TableRowSticky scrollAreaRef={scrollAreaRef}>
                        <th scope="col">
                            <div key="select-all" className="flex" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                    readOnly
                                    className="increase-surface-click"
                                    disabled={!contents.length}
                                    checked={allSelected}
                                    onChange={onToggleAllSelected}
                                />
                            </div>
                        </th>
                        <th scope="col">
                            <div className="ellipsis">{c('TableHeader').t`Name`}</div>
                        </th>
                        {isTrash && <th scope="col" className="w25">{c('TableHeader').t`Location`}</th>}
                        <th scope="col" className={isDesktop ? 'w10' : 'w15'}>{c('TableHeader').t`Type`}</th>
                        {isDesktop && (
                            <th scope="col" className="w20">
                                {modifiedHeader}
                            </th>
                        )}
                        <th scope="col" className={isDesktop ? 'w10' : 'w15'}>{c('TableHeader').t`Size`}</th>
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
                        />
                    ))}
                    {loading && <TableRowBusy colSpan={colSpan} />}
                </TableBody>
            </table>
        </div>
    );
};

export default FileBrowser;
