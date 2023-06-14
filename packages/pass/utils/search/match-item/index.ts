import type { Item, ItemType } from '@proton/pass/types';
import type { ItemMatchFunc, ItemMatchFuncMap } from '@proton/pass/utils/search';

import matchesAliasItem from './alias.match';
import matchesLoginItem from './login.match';
import matchesNoteItem from './note.match';

/**
 * Each item should expose its own searching mechanism :
 * we may include/exclude certain fields or add extra criteria
 * depending on the type of item we're targeting
 */
const itemMatchers: ItemMatchFuncMap = {
    login: matchesLoginItem,
    note: matchesNoteItem,
    alias: matchesAliasItem,
};

export const matchItem: ItemMatchFunc = <T extends ItemType>(item: Item<T>) => itemMatchers[item.type](item);
