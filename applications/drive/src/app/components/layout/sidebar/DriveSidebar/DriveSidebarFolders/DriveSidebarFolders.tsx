import { useEffect } from 'react';

import { useFolderTree } from '../../../../../store';
import DriveSidebarFoldersRoot from './DriveSidebarFoldersRoot';
import DriveSidebarSubfolders from './DriveSidebarSubfolders';

interface Props {
    path: string;
    shareId: string;
    linkId: string;
    setSidebarLevel: (level: number) => void;
}

export default function DriveSidebarFolders({ shareId, linkId, path, setSidebarLevel }: Props) {
    const { deepestOpenedLevel, rootFolder, toggleExpand } = useFolderTree(shareId, { rootLinkId: linkId });

    useEffect(() => {
        setSidebarLevel(deepestOpenedLevel);
    }, [deepestOpenedLevel]);

    return (
        <>
            <DriveSidebarFoldersRoot
                path={path}
                shareId={shareId}
                linkId={linkId}
                rootFolder={rootFolder}
                toggleExpand={toggleExpand}
            />
            <DriveSidebarSubfolders shareId={shareId} rootFolder={rootFolder} toggleExpand={toggleExpand} />
        </>
    );
}
