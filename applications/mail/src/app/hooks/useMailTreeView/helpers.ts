import { IcFolder } from '@proton/icons/icons/IcFolder';
import { IcFolders } from '@proton/icons/icons/IcFolders';
import { toMap } from '@proton/shared/lib/helpers/object';
import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces/Folder';

import type { FolderColorProps, FolderItem, FolderReducerProps } from './interface';

export const getParentFolderColor = ({ folders, folder, mailSettings }: FolderColorProps): string | undefined => {
    if (!mailSettings?.EnableFolderColor) {
        return undefined;
    }

    if (!mailSettings?.InheritParentFolderColor) {
        return folder.Color;
    }

    const folderMap = toMap(folders);
    const visitedParentIDs = new Set<string | number>();
    let current = folder;

    while (current.ParentID) {
        // A cycle in the parent chain would never reach a root folder
        if (visitedParentIDs.has(current.ParentID)) {
            return undefined;
        }
        visitedParentIDs.add(current.ParentID);

        const parent = folderMap[current.ParentID];

        if (!parent) {
            return undefined;
        }

        current = parent;
    }

    return current.Color;
};

export const folderReducer = ({ acc, folder, folders, mailSettings, level }: FolderReducerProps): FolderItem[] => {
    acc.push({
        ...folder,
        Name: folder.Name,
        icon: folder.subfolders?.length ? IcFolders : IcFolder,
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
