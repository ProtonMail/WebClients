import type { FormSubmission, ItemRevision, ItemSortFilter, ItemType, MaybeNull } from '@proton/pass/types';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

export type FieldMatch<T extends ItemType = ItemType> = (item: ItemRevision<T>) => (needle: string) => boolean;
export type ItemMatch<T extends ItemType = ItemType> = (item: ItemRevision<T>) => (needles: string[]) => boolean;
export type ItemMatchMap = { [T in ItemType]: ItemMatch<T> };

export type SelectItemsOptions = {
    search?: string;
    shareId?: MaybeNull<string>;
    sort?: MaybeNull<ItemSortFilter>;
    trashed?: boolean;
    type?: MaybeNull<ItemType>;
};

export type SelectItemsByDomainOptions = {
    isPrivate: boolean;
    port: MaybeNull<string>;
    protocol: MaybeNull<string>;
    shareIds?: string[];
    sortOn?: 'priority' | 'lastUseTime';
    strict?: boolean;
};

export type GetLoginCandidatesOptions = { url?: string; shareIds?: string[]; strict?: boolean };
export type SelectAutofillCandidatesOptions = ParsedUrl & { shareIds?: string[]; strict?: boolean };
export type SelectOTPAutofillCandidateOptions = ParsedUrl & { submission?: FormSubmission };
export type SelectAutosaveCandidatesOptions = { domain: string; userIdentifier?: string; shareIds?: string[] };
