import type { ReactNode } from 'react';

import type { SidebarItem } from '../hooks/useSidebar.store';
import { useSidebarStore } from '../hooks/useSidebar.store';
import { DriveSidebarSubfolder } from './DriveSidebarSubfolder';

type Props = {
    shareId: string;
    children: SidebarItem[];
    toggleExpand: (linkId: string) => Promise<void>;
    defaultLevel?: number;
};

export const DriveSidebarSubfolders = ({ shareId, children, toggleExpand }: Props) => {
    const { getChildren } = useSidebarStore((state) => ({
        getChildren: state.getChildren,
    }));

    if (!children?.length) {
        return null;
    }

    const folderReducer = (acc: ReactNode[], folder: SidebarItem): any[] => {
        acc.push(
            <DriveSidebarSubfolder
                key={folder.uid}
                shareId={shareId}
                item={folder}
                toggleExpand={() => toggleExpand(folder.uid)}
            />
        );

        const subChildren = getChildren(folder.uid);

        if (folder.isExpanded && subChildren?.length) {
            subChildren.forEach((child: SidebarItem) => folderReducer(acc, child));
        }

        return acc;
    };

    return <>{children.reduce((acc: ReactNode[], folder: SidebarItem) => folderReducer(acc, folder), [])}</>;
};
