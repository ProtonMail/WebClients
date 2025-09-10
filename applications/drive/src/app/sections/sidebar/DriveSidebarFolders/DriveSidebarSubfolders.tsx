import type { ReactNode } from 'react';

import { useShallow } from 'zustand/react/shallow';

import type { SidebarItem } from '../hooks/useSidebar.store';
import { useSidebarStore } from '../hooks/useSidebar.store';
import { DriveSidebarSubfolder } from './DriveSidebarSubfolder';

type Props = {
    shareId: string;
    children: SidebarItem[];
    defaultLevel?: number;
};

export const DriveSidebarSubfolders = ({ shareId, children }: Props) => {
    const { getChildren } = useSidebarStore(
        useShallow((state) => ({
            getChildren: state.getChildren,
        }))
    );

    if (!children?.length) {
        return null;
    }

    const folderReducer = (acc: ReactNode[], folder: SidebarItem): any[] => {
        acc.push(<DriveSidebarSubfolder key={folder.uid} shareId={shareId} item={folder} />);

        const subChildren = getChildren(folder.uid);

        if (folder.isExpanded && subChildren?.length) {
            subChildren.forEach((child: SidebarItem) => folderReducer(acc, child));
        }

        return acc;
    };

    return <>{children.reduce((acc: ReactNode[], folder: SidebarItem) => folderReducer(acc, folder), [])}</>;
};
