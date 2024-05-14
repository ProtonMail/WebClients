import type { ItemRevision, ItemSortFilter, ItemType, MaybeNull } from '@proton/pass/types';
import type { ParsedUrl } from '@proton/pass/utils/url/parser';

export type ItemMatchFuncMap = { [T in ItemType]: ItemMatchFunc<T> };
export type ItemMatchFunc<T extends ItemType = ItemType, Options extends any = any> = (
    item: ItemRevision<T>
) => (searchTerm: string, options?: Options) => boolean;

export type SelectItemsOptions = {
    type?: MaybeNull<ItemType>;
    shareId?: MaybeNull<string>;
    search?: string;
    sort?: MaybeNull<ItemSortFilter>;
    trashed?: boolean;
};

export type SelectItemsByDomainOptions = {
    protocol: MaybeNull<string>;
    isPrivate: boolean;
    shareIds?: string[];
    sortOn?: 'priority' | 'lastUseTime';
};

export type SelectAutofillCandidatesOptions = ParsedUrl & { shareIds?: string[] };

export type SelectAutosaveCandidatesOptions = {
    domain: string;
    subdomain: MaybeNull<string>;
    itemEmail: string;
    shareIds?: string[];
};
