import { useEffect } from 'react';

import { useFolderTree } from '../../../../../store';
import DriveSidebarFoldersRoot from './DriveSidebarFoldersRoot';
import DriveSidebarSubfolders from './DriveSidebarSubfolders';

interface Props {
    shareId: string;
    linkId: string;
    setSidebarLevel: (level: number) => void;
}

export default function DriveSidebarFolders({ shareId, linkId, setSidebarLevel }: Props) {
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
            />
            <DriveSidebarSubfolders shareId={shareId} rootFolder={rootFolder} toggleExpand={toggleExpand} />
        </>
    );
}
