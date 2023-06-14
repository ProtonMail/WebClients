import type { Item, ItemType, ItemsSortOption, MaybeNull } from '@proton/pass/types';

import type { ParsedUrl } from '../url';

export type ItemMatchFuncMap = { [T in ItemType]: ItemMatchFunc<T> };
export type ItemMatchFunc<T extends ItemType = ItemType, Options extends any = any> = (
    item: Item<T>
) => (searchTerm: string, options?: Options) => boolean;

export type SelectItemsOptions = {
    itemType?: MaybeNull<ItemType>;
    shareId?: MaybeNull<string>;
    search?: string;
    sort?: MaybeNull<ItemsSortOption>;
};

export type SelectItemsByDomainOptions = {
    protocolFilter: string[];
    isPrivate: boolean;
    shareId?: string;
    sortOn?: 'priority' | 'lastUseTime';
};

export type SelectAutofillCandidatesOptions = ParsedUrl & { shareId?: string };
export type SelectAutosaveCandidatesOptions = { domain: string; subdomain: MaybeNull<string>; username: string };
