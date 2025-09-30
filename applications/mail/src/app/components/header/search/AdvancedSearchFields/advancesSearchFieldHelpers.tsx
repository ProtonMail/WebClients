import type { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { formatFolderName } from '@proton/shared/lib/helpers/folder';
import type { FolderWithSubFolders } from '@proton/shared/lib/interfaces';

import type { getStandardFolders } from 'proton-mail/helpers/labels';

import type { Item, ItemCustomFolder, ItemDefaultFolder, ItemLabel } from './useLocationFieldOptions';

export const isDefaultFolder = (item: Item): item is ItemDefaultFolder => 'url' in item && 'icon' in item;
export const isCustomFolder = (item: Item): item is ItemCustomFolder => 'folderEntity' in item;
export const isLabel = (item: Item): item is ItemLabel => 'color' in item;

const getMarginByFolderLvl = (level: number) => {
    switch (level) {
        case 1:
            return 'ml-2';
        case 2:
        case 3:
        case 4:
            return 'ml-4';
        default:
            return '';
    }
};

export const folderReducer = (acc: ItemCustomFolder[], folder: FolderWithSubFolders, level = 0) => {
    acc.push({
        text: formatFolderName(level, folder.Name),
        value: folder.ID,
        className: getMarginByFolderLvl(level),
        folderEntity: folder,
    });

    if (Array.isArray(folder.subfolders)) {
        folder.subfolders.forEach((folder) => folderReducer(acc, folder, level + 1));
    }

    return acc;
};

export const buildFolderOption = (folderMap: ReturnType<typeof getStandardFolders>, folderID: MAILBOX_LABEL_IDS) => ({
    value: folderID,
    text: folderMap[folderID].name,
    url: folderMap[folderID].to,
    icon: folderMap[folderID].icon,
});
