import { TableRowBusy } from '@proton/components';

import { DecryptedLink, TreeItem } from '../../store';
import ExpandableRow from './ExpandableRow';

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
        <div className="folder-tree">
            <table className="folder-tree-table simple-table simple-table--is-hoverable ">
                <tbody>{isLoaded ? rows : <TableRowBusy />}</tbody>
            </table>
        </div>
    );
};

export default FolderTree;
