import React, { ReactNode, memo } from 'react';
import { Folder, FolderWithSubFolders } from 'proton-shared/lib/interfaces/Folder';

import { getUnreadCount } from '../../helpers/sidebar';
import SidebarFolder from './SidebarFolder';
import EmptyFolders from './EmptyFolders';
import { UnreadCounts } from './MailSidebarList';

interface Props {
    currentLabelID: string;
    counterMap: UnreadCounts;
    folders: Folder[];
    loadingFolders: boolean;
    updateFocusItem: (item: string) => void;
    handleToggleFolder: (folder: Folder, expanded: boolean) => void;
    foldersTreeview: FolderWithSubFolders[];
}

const SidebarFolders = ({
    currentLabelID,
    counterMap,
    folders,
    loadingFolders,
    updateFocusItem,
    handleToggleFolder,
    foldersTreeview,
}: Props) => {
    const treeviewReducer = (acc: ReactNode[], folder: FolderWithSubFolders, level = 0): any[] => {
        acc.push(
            <SidebarFolder
                key={folder.ID}
                currentLabelID={currentLabelID}
                folder={folder}
                level={level}
                onToggle={handleToggleFolder}
                expanded={Boolean(folder.Expanded)}
                unreadCount={getUnreadCount(counterMap, folder)}
                id={folder.ID}
                onFocus={() => updateFocusItem(folder.ID)}
            />
        );

        if (folder.Expanded && Array.isArray(folder.subfolders) && folder.subfolders.length) {
            folder.subfolders.forEach((folder: FolderWithSubFolders) => treeviewReducer(acc, folder, level + 1));
        }

        return acc;
    };

    return !loadingFolders && !folders?.length ? (
        <EmptyFolders onFocus={() => updateFocusItem('add-folder')} />
    ) : (
        <>
            {foldersTreeview.reduce(
                (acc: React.ReactNode[], folder: FolderWithSubFolders) => treeviewReducer(acc, folder),
                []
            )}
        </>
    );
};

export default memo(SidebarFolders);
