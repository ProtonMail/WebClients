import { useMemo } from 'react';

import type { TreeItemWithChildren } from '@proton/drive/modules/directoryTree';

import { sortChildrenByName } from '../utils';
import { DriveSidebarSubfolder } from './DriveSidebarSubfolder';

type Props = {
    shareId: string;
    items: TreeItemWithChildren['children'];
    toggleExpand: (treeItemId: string) => Promise<void>;
    level: number;
};

export const DriveSidebarSubfolders = ({ shareId, items, toggleExpand, level }: Props) => {
    const sortedFolders = useMemo(() => sortChildrenByName(items), [items]);

    if (!sortedFolders.length) {
        return null;
    }

    return (
        <>
            {sortedFolders.map((item) => (
                <DriveSidebarSubfolder
                    key={item.treeItemId}
                    shareId={shareId}
                    item={item}
                    toggleExpand={toggleExpand}
                    level={level}
                />
            ))}
        </>
    );
};
