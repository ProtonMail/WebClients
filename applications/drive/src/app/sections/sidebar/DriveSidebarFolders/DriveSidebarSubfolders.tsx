import { useMemo } from 'react';

import type { TreeItemWithChildren } from '../../../modules/directoryTree';
import { stringComparator } from '../../../modules/sorting';
import { DriveSidebarSubfolder } from './DriveSidebarSubfolder';

type Props = {
    shareId: string;
    children: TreeItemWithChildren[];
    toggleExpand: (treeItemId: string) => Promise<void>;
    level: number;
};

export const DriveSidebarSubfolders = ({ shareId, children, toggleExpand, level }: Props) => {
    const sortedFolders = useMemo(() => children.sort((a, b) => stringComparator(a.name, b.name)), [children]);

    if (!children?.length) {
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
