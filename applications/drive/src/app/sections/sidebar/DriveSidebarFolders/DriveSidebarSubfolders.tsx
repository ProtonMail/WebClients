import type { ReactNode } from 'react';

import type { TreeItem } from '../../../store';
import { DriveSidebarSubfolder } from './DriveSidebarSubfolder';

interface Props {
    shareId: string;
    rootFolder?: TreeItem;
    toggleExpand: (linkId: string) => void;
    defaultLevel?: number;
}

export const DriveSidebarSubfolders = ({ shareId, rootFolder, toggleExpand, defaultLevel = 0 }: Props) => {
    if (!rootFolder || !rootFolder.isExpanded || !rootFolder.children?.length) {
        return null;
    }

    const folderReducer = (acc: ReactNode[], folder: TreeItem, level = defaultLevel): any[] => {
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
};
