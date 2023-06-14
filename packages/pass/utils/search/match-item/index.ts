import type { Item, ItemRevision, ItemType, ItemsSortOption, MaybeNull } from '@proton/pass/types';
import type { ItemMatchFunc, ItemMatchFuncMap } from '@proton/pass/utils/search';

import matchesAliasItem from './alias.match';
import matchesLoginItem from './login.match';
import matchesNoteItem from './note.match';

/* Each item should expose its own searching mechanism :
 * we may include/exclude certain fields or add extra criteria
 * depending on the type of item we're targeting */
const itemMatchers: ItemMatchFuncMap = {
    login: matchesLoginItem,
    note: matchesNoteItem,
    alias: matchesAliasItem,
};

export const matchItem: ItemMatchFunc = <T extends ItemType>(item: Item<T>) => itemMatchers[item.type](item);

export const matchItems = <T extends ItemRevision>(items: T[], search?: string) => {
    if (!search || search.trim() === '') return items;
    return items.filter((item) => matchItem(item.data)(search));
};

export const filterItemsByShareId = <T extends ItemRevision>(items: T[], shareId?: MaybeNull<string>) => {
    if (!shareId) return items;
    return items.filter((item) => shareId === item.shareId);
};

export const filterItemsByType = <T extends ItemRevision>(items: T[], itemType?: MaybeNull<ItemType>) => {
    if (!itemType) return items;
    return items.filter((item) => !itemType || itemType === item.data.type);
};

export const sortItems = <T extends ItemRevision>(items: T[], sort?: MaybeNull<ItemsSortOption>) => {
    if (!sort) return items;

    return items.sort((a, b) => {
        switch (sort) {
            case 'createTimeASC':
                return a.createTime - b.createTime;
            case 'createTimeDESC':
                return b.createTime - a.createTime;
            case 'recent':
                return (
                    Math.max(b.lastUseTime ?? b.modifyTime, b.modifyTime) -
                    Math.max(a.lastUseTime ?? a.modifyTime, a.modifyTime)
                );
            case 'titleASC':
                return a.data.metadata.name.localeCompare(b.data.metadata.name);
        }
    });
};
