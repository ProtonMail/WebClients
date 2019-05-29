export const addSieveFilter = ({ Name, Sieve, Version }) => ({
    method: 'post',
    url: 'filters',
    data: { Name, Sieve, Version }
});

export const addTreeFilter = ({ ID, Name, Status, Version, Simple, Tree, Sieve }) => ({
    method: 'post',
    url: 'filters',
    data: { ID, Name, Status, Version, Simple, Tree, Sieve }
});

export const queryFilters = () => ({
    method: 'get',
    url: 'filters'
});

export const clearFilters = () => ({
    method: 'delete',
    url: 'filters'
});

// eslint-disable-next-line
export const updateFilter = (filterID, { Name, Status, Version, Sieve, Simple, Tree }) => ({
    method: 'put',
    url: `filters/${filterID}`,
    data: { Name, Status, Version, Simple, Tree, Sieve }
});

export const checkSieveFilter = ({ Sieve, Version } = {}) => ({
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

export const toggleEnable = (ID, enable = true) => (enable ? enableFilter : disableFilter)(ID);

export const deleteFilter = (filterID) => ({
    method: 'delete',
    url: `filters/${filterID}`
});

export const updateFilterOrder = (FilterIDs) => ({
    method: 'put',
    url: 'filters/order',
    data: { FilterIDs }
});
