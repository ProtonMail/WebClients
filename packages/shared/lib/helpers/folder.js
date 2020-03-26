import { orderBy, range } from './array';
import { ROOT_FOLDER } from '../constants';

export const order = (folders = []) => orderBy(folders, 'Order');

export const getParents = (folders = []) => {
    return folders.reduce((acc, item) => {
        const { ParentID = ROOT_FOLDER } = item;
        acc[ParentID] = acc[ParentID] || [];
        acc[ParentID].push(item);
        return acc;
    }, {});
};

export const buildTreeview = (folders = []) => {
    const parents = getParents(folders);
    const build = (parentID = ROOT_FOLDER) => {
        if (!Array.isArray(parents[parentID])) {
            return [];
        }
        return order(parents[parentID]).map((item) => ({
            ...item,
            subfolders: build(item.ID)
        }));
    };
    return build();
};

export const formatFolderName = (time = 0, name = '', separator = ' ') =>
    `${range(0, time)
        .map(() => separator)
        .join('')}${name}`;
