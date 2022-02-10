import { ReactNode } from 'react';

import { TreeItem } from '../../../../store';
import DriveSidebarSubfolder from './DriveSidebarSubfolder';

interface Props {
    shareId: string;
    rootFolder?: TreeItem;
    toggleExpand: (linkId: string) => void;
}

export default function DriveSidebarSubfolders({ shareId, rootFolder, toggleExpand }: Props) {
    if (!rootFolder || !rootFolder.isExpanded || !rootFolder.children?.length) {
        return null;
    }

    const folderReducer = (acc: ReactNode[], folder: TreeItem, level = 0): any[] => {
        acc.push(
            <DriveSidebarSubfolder
                key={folder.link.linkId}
                shareId={shareId}
                folder={folder}
                level={level}
                toggleExpand={() => toggleExpand(folder.link.linkId)}
            />
        );
        if (folder.isExpanded && folder.children?.length) {
            folder.children.forEach((subfolder: TreeItem) => folderReducer(acc, subfolder, level + 1));
        }
        return acc;
    };
    return <>{rootFolder.children.reduce((acc: ReactNode[], folder: TreeItem) => folderReducer(acc, folder), [])}</>;
}
