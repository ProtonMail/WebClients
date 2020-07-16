import { orderBy, range } from './array';
import { ROOT_FOLDER } from '../constants';
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

export const buildTreeview = (folders: Folder[] = []) => {
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
