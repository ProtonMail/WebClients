import { useShallow } from 'zustand/react/shallow';

import type { SidebarItem } from '../hooks/useSidebar.store';
import { useSidebarStore } from '../hooks/useSidebar.store';
import { DriveSidebarFoldersRoot } from './DriveSidebarFoldersRoot';
import { DriveSidebarSubfolders } from './DriveSidebarSubfolders';

type DriveSidebarFoldersProps = {
    shareId: string;
    linkId: string;
    rootFolder: SidebarItem;
};

export const DriveSidebarFolders = ({ rootFolder, shareId, linkId }: DriveSidebarFoldersProps) => {
    const { children } = useSidebarStore(
        useShallow((state) => ({
            children: state.getChildren(rootFolder.uid),
        }))
    );

    return (
        <>
            <DriveSidebarFoldersRoot shareId={shareId} linkId={linkId} rootFolder={rootFolder} />
            {rootFolder.isExpanded && (
                <DriveSidebarSubfolders key={rootFolder.uid} shareId={shareId} children={children} />
            )}
        </>
    );
};
