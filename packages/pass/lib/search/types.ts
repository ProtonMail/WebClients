import type { FormSubmission, ItemRevision, ItemSortFilter, ItemType, MaybeNull } from '../../types';
import type { ParsedUrl } from '../urls/types';

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
    sort?: MaybeNull<ItemSortFilter>;
    trashed?: boolean;
    type?: MaybeNull<ItemType>;
    visible?: boolean;
};

export type SelectItemsByDomainOptions = {
    isPrivate: boolean;
    port: MaybeNull<string>;
    protocol: MaybeNull<string>;
    shareIds?: string[];
    sortOn?: 'priority' | 'lastUseTime';
    strict?: boolean;
    visible?: boolean;
};

export type GetLoginCandidatesOptions = { url?: string; shareIds?: string[]; strict?: boolean };
export type SelectAutofillCandidatesOptions = ParsedUrl & { shareIds?: string[]; strict?: boolean };
export type SelectOTPAutofillCandidateOptions = ParsedUrl & { submission?: FormSubmission };
export type SelectAutosaveCandidatesOptions = { domain: string; userIdentifier?: string; shareIds?: string[] };
