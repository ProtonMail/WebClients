import { Label, UserModel } from '@proton/shared/lib/interfaces';
import orderBy from '@proton/utils/orderBy';
import range from '@proton/utils/range';

import { FREE_USER_FOLDERS_LIMIT, FREE_USER_LABELS_LIMIT, ROOT_FOLDER } from '../constants';
import { Folder, FolderWithSubFolders } from '../interfaces/Folder';

export const order = (folders: Folder[] = []) => orderBy(folders, 'Order');

export const getParents = (folders: Folder[] = []) => {
    return folders.reduce<{ [key: string]: Folder[] }>((acc, item) => {
        const { ParentID = ROOT_FOLDER } = item;
        acc[ParentID] = acc[ParentID] || [];
        acc[ParentID].push(item);
        return acc;
    }, {});
};

export const buildTreeview = (folders: FolderWithSubFolders[] = []) => {
    const parents = getParents(folders);
    const build = (parentID: string | number = ROOT_FOLDER): FolderWithSubFolders[] => {
        if (!Array.isArray(parents[parentID])) {
            return [];
        }
        return order(parents[parentID]).map((item) => ({
            ...item,
            subfolders: build(item.ID),
        }));
    };
    return build();
};

export const formatFolderName = (time = 0, name = '', separator = ' ') =>
    `${range(0, time)
        .map(() => separator)
        .join('')}${name}`;

export const hasReachedFolderLimit = (user: UserModel, userFolders: Folder[]) => {
    const { hasPaidMail } = user;

    return !hasPaidMail && userFolders.length >= FREE_USER_FOLDERS_LIMIT;
};

export const hasReachedLabelLimit = (user: UserModel, userLabels: Label[]) => {
    const { hasPaidMail } = user;

    return !hasPaidMail && userLabels.length >= FREE_USER_LABELS_LIMIT;
};
