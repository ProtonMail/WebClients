import type { ItemRevision, ItemSortFilter, ItemType, MaybeNull } from '../../types';

export type PrivateDomains = MaybeNull<Set<string>>;

/** Relevance score of matching a needle/needles against an item. `0` means no
 * match; a higher score encodes both which field matched (field weight) and how
 * well it matched (match quality) - see `match-items.ts`. */
export type FieldMatch<T extends ItemType = ItemType> = (item: ItemRevision<T>) => (needle: string) => number;
export type ItemMatch<T extends ItemType = ItemType> = (item: ItemRevision<T>) => (needles: string[]) => number;
export type ItemMatchMap = { [T in ItemType]: ItemMatch<T> };

export type SelectItemsOptions = {
    search?: string;
    shareId?: MaybeNull<string>;
    folderId?: MaybeNull<string>;
    sort?: MaybeNull<ItemSortFilter>;
    trashed?: boolean;
    type?: MaybeNull<ItemType>;
    visible?: boolean;
};

export type SelectAutosaveCandidatesOptions = { domain: string; userIdentifier?: string; shareIds?: string[] };
