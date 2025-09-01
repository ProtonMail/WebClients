import { useEffect } from 'react';

import { useFolderTree } from '../../../store';
import { DriveSidebarFoldersRoot } from './DriveSidebarFoldersRoot';
import { DriveSidebarSubfolders } from './DriveSidebarSubfolders';

interface DriveSidebarFoldersProps {
    shareId: string;
    linkId: string;
    setSidebarLevel: (level: number) => void;
    collapsed: boolean;
}

export const DriveSidebarFolders = ({ shareId, linkId, setSidebarLevel, collapsed }: DriveSidebarFoldersProps) => {
    const { deepestOpenedLevel, rootFolder, toggleExpand } = useFolderTree(shareId, { rootLinkId: linkId });

    useEffect(() => {
        setSidebarLevel(deepestOpenedLevel);
    }, [deepestOpenedLevel]);

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
                <DriveSidebarSubfolders shareId={shareId} rootFolder={rootFolder} toggleExpand={toggleExpand} />
            )}
        </>
    );
};
