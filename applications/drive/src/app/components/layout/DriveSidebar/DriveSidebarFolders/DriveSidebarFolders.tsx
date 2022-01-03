import { useEffect } from 'react';

import useFolders from './useFolders';
import DriveSidebarFoldersRoot from './DriveSidebarFoldersRoot';
import DriveSidebarSubfolders from './DriveSidebarSubfolders';

interface Props {
    path: string;
    shareId: string;
    linkId: string;
    setSidebarLevel: (level: number) => void;
}

export default function DriveSidebarFolders({ shareId, linkId, path, setSidebarLevel }: Props) {
    const { deepestOpenedLevel, rootFolder, toggleExpand } = useFolders(shareId, linkId);

    useEffect(() => {
        setSidebarLevel(deepestOpenedLevel);
    }, [deepestOpenedLevel]);

    return (
        <>
            <DriveSidebarFoldersRoot path={path} rootFolder={rootFolder} toggleExpand={toggleExpand} />
            <DriveSidebarSubfolders rootFolder={rootFolder} toggleExpand={toggleExpand} />
        </>
    );
}
