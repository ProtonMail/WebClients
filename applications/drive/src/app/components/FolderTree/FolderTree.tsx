import React, { useRef } from 'react';

import { TableRowBusy } from '@proton/components';

import type { DecryptedLink, TreeItem } from '../../store';
import ExpandableRow from './ExpandableRow';
import { FloatingEllipsisContext } from './FloatingEllipsisContext';
import useFloatingEllipsisContext from './hooks/useFloatingEllipsisContext';

interface Props {
    treeItems: TreeItem | TreeItem[];
    selectedItemId?: string;
    onSelect: (link: DecryptedLink) => void;
    rowIsDisabled?: (item: TreeItem) => boolean;
    toggleExpand: (linkId: string) => void;
    isLoaded: boolean;
}

const FolderTree = ({ isLoaded, treeItems, selectedItemId, onSelect, rowIsDisabled, toggleExpand }: Props) => {
    const treeItemsArray = Array.isArray(treeItems) ? treeItems : [treeItems];

    const containerRef = useRef<HTMLDivElement>(null);
    const resizableRef = useRef<HTMLTableElement>(null);

    const context = useFloatingEllipsisContext({ containerRef, resizableRef });

    const generateRows = (items: TreeItem[], depth = 0) => {
        const rows = items.map((item: TreeItem) => {
            const { link, children, isExpanded, isLoaded } = item;
            const isDisabled = rowIsDisabled ? rowIsDisabled(item) : false;
            const childrenRows = children.length ? generateRows(children, depth + 1) : null;
            return (
                <ExpandableRow
                    key={link.linkId}
                    link={link}
                    isDisabled={isDisabled}
                    isSelected={selectedItemId === link.linkId}
                    isExpanded={isExpanded}
                    isLoaded={isLoaded}
                    depth={depth}
                    onSelect={onSelect}
                    toggleExpand={toggleExpand}
                >
                    {childrenRows}
                </ExpandableRow>
            );
        });

        return <>{rows}</>;
    };

    const rows = generateRows(treeItemsArray);

    return (
        <FloatingEllipsisContext.Provider value={context}>
            <div className="folder-tree" ref={containerRef}>
                <table ref={resizableRef} className="folder-tree-table simple-table simple-table--is-hoverable ">
                    <tbody>{isLoaded ? rows : <TableRowBusy />}</tbody>
                </table>
            </div>
        </FloatingEllipsisContext.Provider>
    );
};

export default FolderTree;
