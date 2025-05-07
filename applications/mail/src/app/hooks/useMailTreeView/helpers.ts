import { toMap } from '@proton/shared/lib/helpers/object';
import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces';

import type { FolderColorProps, FolderItem, FolderReducerProps } from './interface';

export const getParentFolderColor = ({ folders, folder, mailSettings }: FolderColorProps): string | undefined => {
    if (!mailSettings?.EnableFolderColor) {
        return undefined;
    }

    if (!mailSettings?.InheritParentFolderColor) {
        return folder.Color;
    }

    if (!folder.ParentID) {
        return folder.Color;
    }

    const folderMap = toMap(folders);
    const folderTmp = folderMap[folder.ParentID];

    if (folderTmp) {
        return getParentFolderColor({ folders, folder: folderTmp, mailSettings });
    }

    return undefined;
};

export const folderReducer = ({ acc, folder, folders, mailSettings, level }: FolderReducerProps): FolderItem[] => {
    acc.push({
        ...folder,
        Name: folder.Name,
        icon: folder.subfolders?.length ? 'folders' : 'folder',
        color: getParentFolderColor({ folders, folder, mailSettings }),
        level,
    });

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder: FolderWithSubFolders) =>
            folderReducer({ acc, folder, folders, mailSettings, level: level + 1 })
        );
    }

    return acc;
};
