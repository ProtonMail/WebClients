import React from 'react';
import { TableRowBusy } from '@proton/components';
import { LinkType } from '../../interfaces/link';
import ExpandableRow from './ExpandableRow';

export interface FolderTreeItem {
    linkId: string;
    name: string;
    type: LinkType;
    mimeType: string;
    children: { list: FolderTreeItem[]; complete: boolean };
}

interface Props {
    items: FolderTreeItem[];
    initiallyExpandedFolders: string[];
    selectedItemId?: string;
    loading?: boolean;
    onSelect: (LinkID: string) => void;
    loadChildren: (LinkID: string, loadNextPage?: boolean) => Promise<void>;
    rowIsDisabled?: (item: FolderTreeItem) => boolean;
}

const FolderTree = ({
    items,
    initiallyExpandedFolders,
    selectedItemId,
    loading = false,
    onSelect,
    loadChildren,
    rowIsDisabled,
}: Props) => {
    const generateRows = (items: FolderTreeItem[], depth = 0) => {
        const rows = items.map((item: FolderTreeItem) => {
            const { linkId, name, type, mimeType, children } = item;
            const disabled = rowIsDisabled ? rowIsDisabled(item) : false;
            const childrenRows = children.list.length ? generateRows(children.list, depth + 1) : null;
            const isExpanded = initiallyExpandedFolders.includes(linkId);

            return (
                <ExpandableRow
                    key={linkId}
                    linkId={linkId}
                    name={name}
                    type={type}
                    mimeType={mimeType}
                    depth={depth}
                    isSelected={selectedItemId === linkId}
                    isExpanded={isExpanded}
                    disabled={disabled}
                    onSelect={onSelect}
                    loadChildren={loadChildren}
                    childrenComplete={children.complete}
                >
                    {childrenRows}
                </ExpandableRow>
            );
        });

        return <>{rows}</>;
    };

    const rows = generateRows(items);

    return (
        <div className="folder-tree">
            <table className="folder-tree-table simple-table simple-table--is-hoverable ">
                <tbody>{loading ? <TableRowBusy /> : rows}</tbody>
            </table>
        </div>
    );
};

export default FolderTree;
