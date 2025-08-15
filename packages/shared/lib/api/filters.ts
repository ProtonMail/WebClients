import type { Filter } from '@proton/components/containers/filters/interfaces';
import type { MailSearchContext } from '@proton/shared/lib/api/messages';
import type { Nullable } from '@proton/shared/lib/interfaces';

type AddSieveFilterParams = Required<Pick<Filter, 'Name' | 'Sieve' | 'Version'>>;
export const addSieveFilter = ({ Name, Sieve, Version }: AddSieveFilterParams) => ({
    method: 'post',
    url: 'mail/v4/filters',
    data: { Name, Sieve, Version },
});

export const addTreeFilter = (
    {
        ID,
        Name,
        Status,
        Version,
        Simple,
        Tree,
        Sieve,
    }: Pick<Filter, 'ID' | 'Name' | 'Status' | 'Version' | 'Simple' | 'Tree' | 'Sieve'>,
    Source?: 'AutoLabel' | 'AutoFolder'
) => ({
    method: 'post',
    url: 'mail/v4/filters',
    data: { ID, Name, Status, Version, Simple, Tree, Sieve },
    params: { Source },
});

export const queryFilters = () => ({
    method: 'get',
    url: 'mail/v4/filters',
});

export const queryFilter = (id: string) => ({
    method: 'get',
    url: `mail/v4/filters/${id}`,
});

export const clearFilters = () => ({
    method: 'delete',
    url: 'mail/v4/filters',
});

export const updateFilter = (
    filterID: string,
    {
        Name,
        Status,
        Version,
        Sieve,
        Simple,
        Tree,
    }: Pick<Filter, 'ID' | 'Name' | 'Status' | 'Version' | 'Simple' | 'Tree' | 'Sieve'>
) => ({
    method: 'put',
    url: `mail/v4/filters/${filterID}`,
    data: {
        Name,
        Status,
        Version,
        Simple,
        Tree,
        Sieve,
    },
});

export const checkSieveFilter = (
    { Sieve, Version }: Partial<Pick<Filter, 'Sieve' | 'Version'>> = { Sieve: undefined, Version: undefined }
) => ({
    method: 'put',
    url: 'mail/v4/filters/check',
    data: { Sieve, Version },
});

export const enableFilter = (filterID: string) => ({
    method: 'put',
    url: `mail/v4/filters/${filterID}/enable`,
});

export const disableFilter = (filterID: string) => ({
    method: 'put',
    url: `mail/v4/filters/${filterID}/disable`,
});

export const toggleEnable = (ID: string, enable = true) => (enable ? enableFilter : disableFilter)(ID);

export const deleteFilter = (filterID: string) => ({
    method: 'delete',
    url: `mail/v4/filters/${filterID}`,
});

export const updateFilterOrder = (FilterIDs: string[]) => ({
    method: 'put',
    url: 'mail/v4/filters/order',
    data: { FilterIDs },
});

interface ApplyFiltersParams {
    SearchContext?: Nullable<MailSearchContext>;
    Version?: Nullable<string>;
    Sieve?: Nullable<string>;
    AllFilters?: 0 | 1;
    FilterIDs?: string[];
    AllowList?: 0 | 1;
    BlockList?: 0 | 1;
    SpamList?: 0 | 1;
}

export const applyFilters = ({
    SearchContext = null,
    Version = null,
    Sieve = null,
    AllFilters = 0,
    FilterIDs = [],
    AllowList = 0,
    BlockList = 0,
    SpamList = 0,
}: ApplyFiltersParams) => ({
    method: 'post',
    url: 'mail/v4/messages/apply-filters',
    data: {
        SearchContext,
        Version,
        Sieve,
        AllFilters,
        FilterIDs,
        AllowList,
        BlockList,
        SpamList,
    },
});
