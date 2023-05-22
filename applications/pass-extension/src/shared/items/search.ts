import type { Item, ItemType } from '@proton/pass/types';
import type { ItemMatchFunc, ItemMatchFuncMap } from '@proton/pass/utils/search';

import matchesAliasItem from '../../popup/views/Item/Alias/Alias.match';
import matchesLoginItem from '../../popup/views/Item/Login/Login.match';
import matchesNoteItem from '../../popup/views/Item/Note/Note.match';

/**
 * Each item should expose its own searching mechanism :
 * we may include/exclude certain fields or add extra criteras
 * depending on the type of item we're targetting
 */
const itemMatchers: ItemMatchFuncMap = {
    login: matchesLoginItem,
    note: matchesNoteItem,
    alias: matchesAliasItem,
};

export const matchItem: ItemMatchFunc = <T extends ItemType>(item: Item<T>) => itemMatchers[item.type](item);
