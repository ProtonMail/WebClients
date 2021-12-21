import { useEffect } from 'react';

import useFolders from './useFolders';
import DriveSidebarFoldersRoot from './DriveSidebarFoldersRoot';
import DriveSidebarSubfolders from './DriveSidebarSubfolders';

interface Props {
    path: string;
    shareId: string;
    linkId: string;
    setSidebarExtraWidth: (extraWidth: boolean) => void;
}

export default function DriveSidebarFolders({ shareId, linkId, path, setSidebarExtraWidth }: Props) {
    const { expandedDeepStructure, rootFolder, toggleExpand } = useFolders(shareId, linkId);

    useEffect(() => {
        setSidebarExtraWidth(expandedDeepStructure);
    }, [expandedDeepStructure]);

    return (
        <>
            <DriveSidebarFoldersRoot path={path} rootFolder={rootFolder} toggleExpand={toggleExpand} />
            <DriveSidebarSubfolders rootFolder={rootFolder} toggleExpand={toggleExpand} />
        </>
    );
}
