import React from 'react';
import ExpandableRow from './ExpandableRow';

export interface FolderTreeItem {
    linkId: string;
    name: string;
    children: { list: FolderTreeItem[]; complete: boolean };
}

interface Props {
    folders: FolderTreeItem[];
    selectedFolderId?: string;
    onSelect: (LinkID: string) => void;
    loadChildren: (LinkID: string, loadNextPage?: boolean) => Promise<void>;
}

const FolderTree = ({ folders, selectedFolderId, onSelect, loadChildren }: Props) => {
    const generateRows = (folders: FolderTreeItem[], depth = 0) => {
        const rows = folders.map(({ linkId, name, children }: FolderTreeItem) => {
            const childrenRows = children.list.length ? generateRows(children.list, depth + 1) : null;
            return (
                <ExpandableRow
                    key={linkId}
                    linkId={linkId}
                    name={name}
                    depth={depth}
                    isSelected={selectedFolderId === linkId}
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

    const rows = generateRows(folders);

    return (
        <div className="pd-folder-tree">
            <table className="pm-simple-table pm-simple-table--isHoverable">
                <tbody>{rows}</tbody>
            </table>
        </div>
    );
};

export default FolderTree;
