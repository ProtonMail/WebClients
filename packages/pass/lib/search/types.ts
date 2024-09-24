import type { FormSubmission, ItemRevision, ItemSortFilter, ItemType, MaybeNull } from '@proton/pass/types';
import type { ParsedUrl } from '@proton/pass/utils/url/types';

export type ItemMatchFuncMap = { [T in ItemType]: ItemMatchFunc<T> };

export type ItemMatchFunc<T extends ItemType = ItemType> = (item: ItemRevision<T>) => (needles: string[]) => boolean;

export type SelectItemsOptions = {
    search?: string;
    shareId?: MaybeNull<string>;
    sort?: MaybeNull<ItemSortFilter>;
    trashed?: boolean;
    type?: MaybeNull<ItemType>;
};

export type SelectItemsByDomainOptions = {
    isPrivate: boolean;
    protocol: MaybeNull<string>;
    shareIds?: string[];
    sortOn?: 'priority' | 'lastUseTime';
    strict?: boolean;
};

export type SelectAutofillCandidatesOptions = ParsedUrl & { shareIds?: string[]; strict?: boolean };
export type SelectOTPAutofillCandidateOptions = ParsedUrl & { submission?: FormSubmission };

export type SelectAutosaveCandidatesOptions = {
    domain: string;
    subdomain: MaybeNull<string>;
    userIdentifier: string;
    shareIds?: string[];
};
