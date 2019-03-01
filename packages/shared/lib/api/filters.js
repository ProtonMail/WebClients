export const addSieveFilter = ({ Name, Sieve, Version }) => ({
    method: 'post',
    url: 'filters',
    data: { Name, Sieve, Version }
});

export const addTreeFilter = ({ Name, Tree, Version }) => ({
    method: 'post',
    url: 'filters',
    data: { Name, Tree, Version }
});

export const queryFilters = () => ({
    method: 'get',
    url: 'filters'
});

export const clearFilters = () => ({
    method: 'delete',
    url: 'filters'
});

export const updateFilter = (filterID, { Name, Sieve, Tree, Version }) => ({
    method: 'put',
    url: `filters/${filterID}`
});

export const checkSieveFilter = ({ Sieve, Version }) => ({
    method: 'put',
    url: 'filters/check',
    data: { Sieve, Version }
});

export const enableFilter = (filterID) => ({
    method: 'put',
    url: `filters/${filterID}/enable`
});

export const disableFilter = (filterID) => ({
    method: 'put',
    url: `filters/${filterID}/disable`
});

export const deleteFilter = (filterID) => ({
    method: 'delete',
    url: `filters/${filterID}`
});

export const updateFilterOrder = (FilterIDs) => ({
    method: 'put',
    url: 'filters/order',
    data: { FilterIDs }
});