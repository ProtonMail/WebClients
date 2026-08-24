import type { TreeItemWithChildren } from '@proton/drive/modules/directoryTree';

import { stringComparator } from '../../modules/sorting';

export const generateSidebarItemStyle = (nestingLevel: number = 0) => {
    return { marginLeft: `${(nestingLevel * 10) / 16}rem` };
};

/** Returns a new array so callers can safely sort arrays they do not own. */
export const sortTreeItemsByName = (items: TreeItemWithChildren[]): TreeItemWithChildren[] =>
    [...items].sort((a, b) => stringComparator(a.name, b.name));

export const sortChildrenByName = (children: TreeItemWithChildren['children']): TreeItemWithChildren[] =>
    children ? sortTreeItemsByName(Object.values(children)) : [];
