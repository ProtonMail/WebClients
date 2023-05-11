import { ReactNode, memo } from 'react';
import * as React from 'react';

import { c } from 'ttag';

import { Folder, FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import { getUnreadCount } from '../../helpers/sidebar';
import { UnreadCounts } from './MailSidebarList';
import SidebarFolder from './SidebarFolder';

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
    const onlyOneLevel = foldersTreeview.every((folder) => !folder.subfolders?.length);
    const emptyFolders = !loadingFolders && !folders?.length;

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
                onFocus={updateFocusItem}
                treeMode={!onlyOneLevel}
            />
        );

        if (folder.Expanded && Array.isArray(folder.subfolders) && folder.subfolders.length) {
            folder.subfolders.forEach((folder: FolderWithSubFolders) => treeviewReducer(acc, folder, level + 1));
        }

        return acc;
    };

    return emptyFolders ? (
        <div className="py-2 ml-7 text-sm color-weak">{c('Description').t`No folders`}</div>
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
