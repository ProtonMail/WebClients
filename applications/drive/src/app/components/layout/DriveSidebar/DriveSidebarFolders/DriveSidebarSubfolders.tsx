import { ReactNode } from 'react';

import { Folder } from './useFolders';
import DriveSidebarSubfolder from './DriveSidebarSubfolder';

interface Props {
    rootFolder: any;
    toggleExpand: (linkId: string) => void;
}

export default function DriveSidebarSubfolders({ rootFolder, toggleExpand }: Props) {
    if (!rootFolder || !rootFolder.expanded || !rootFolder.subfolders?.length) {
        return null;
    }

    const folderReducer = (acc: ReactNode[], folder: Folder, level = 0): any[] => {
        acc.push(
            <DriveSidebarSubfolder
                key={folder.shareId + folder.linkId}
                folder={folder}
                level={level}
                toggleExpand={() => toggleExpand(folder.linkId)}
            />
        );
        if (folder.expanded && folder.subfolders?.length) {
            folder.subfolders.forEach((subfolder: Folder) => folderReducer(acc, subfolder, level + 1));
        }
        return acc;
    };
    return <>{rootFolder.subfolders.reduce((acc: ReactNode[], folder: Folder) => folderReducer(acc, folder), [])}</>;
}
