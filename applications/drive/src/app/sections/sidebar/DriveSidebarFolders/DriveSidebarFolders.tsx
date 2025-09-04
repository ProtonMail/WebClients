import type { SidebarItem } from '../hooks/useSidebar.store';
import { useSidebarStore } from '../hooks/useSidebar.store';
import { useSidebarFolders } from '../hooks/useSidebarFolders';
import { DriveSidebarFoldersRoot } from './DriveSidebarFoldersRoot';
import { DriveSidebarSubfolders } from './DriveSidebarSubfolders';

type DriveSidebarFoldersProps = {
    shareId: string;
    linkId: string;
    collapsed: boolean;
    rootFolder: SidebarItem;
};

export const DriveSidebarFolders = ({ rootFolder, shareId, linkId, collapsed }: DriveSidebarFoldersProps) => {
    const { loadFolderChildren } = useSidebarFolders();
    const { toggleExpanded, getItem, getChildren } = useSidebarStore((state) => ({
        toggleExpanded: state.toggleExpanded,
        getItem: state.getItem,
        getChildren: state.getChildren,
    }));

    const toggleExpand = async (uid: string) => {
        const item = getItem(uid);
        const wasExpanded = item?.isExpanded ?? false;
        toggleExpanded(uid);

        if (!wasExpanded) {
            await loadFolderChildren(uid);
        }
    };

    return (
        <>
            <DriveSidebarFoldersRoot
                shareId={shareId}
                linkId={linkId}
                rootFolder={rootFolder}
                toggleExpand={toggleExpand}
                collapsed={collapsed}
            />
            {!collapsed && (
                <DriveSidebarSubfolders
                    key={rootFolder.uid}
                    shareId={shareId}
                    children={getChildren(rootFolder.uid)}
                    toggleExpand={toggleExpand}
                />
            )}
        </>
    );
};
