import type { ReactNode } from 'react';
import { memo } from 'react';
import * as React from 'react';

import { c } from 'ttag';

import type { Folder, FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import { getUnreadCount } from '../../helpers/sidebar';
import type { ApplyLabelsParams } from '../../hooks/actions/label/useApplyLabels';
import type { MoveParams } from '../../hooks/actions/move/useMoveToFolder';
import type { UnreadCounts } from './MailSidebarList';
import SidebarFolder from './SidebarFolder';

interface Props {
    currentLabelID: string;
    counterMap: UnreadCounts;
    folders: Folder[];
    loadingFolders: boolean;
    updateFocusItem: (item: string) => void;
    handleToggleFolder: (folder: Folder, expanded: boolean) => void;
    foldersTreeview: FolderWithSubFolders[];
    moveToFolder: (params: MoveParams) => void;
    applyLabels: (params: ApplyLabelsParams) => void;
}

const SidebarFolders = ({
    currentLabelID,
    counterMap,
    folders,
    loadingFolders,
    updateFocusItem,
    handleToggleFolder,
    foldersTreeview,
    moveToFolder,
    applyLabels,
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
                moveToFolder={moveToFolder}
                applyLabels={applyLabels}
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
