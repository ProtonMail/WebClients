export const addSieveFilter = ({ Name, Sieve, Version }) => ({
    method: 'post',
    url: 'mail/v4/filters',
    data: { Name, Sieve, Version }
});

export const addTreeFilter = ({ ID, Name, Status, Version, Simple, Tree, Sieve }) => ({
    method: 'post',
    url: 'mail/v4/filters',
    data: { ID, Name, Status, Version, Simple, Tree, Sieve }
});

export const queryFilters = () => ({
    method: 'get',
    url: 'mail/v4/filters'
});

export const clearFilters = () => ({
    method: 'delete',
    url: 'mail/v4/filters'
});

// eslint-disable-next-line
export const updateFilter = (filterID, { Name, Status, Version, Sieve, Simple, Tree }) => ({
    method: 'put',
    url: `mail/v4/filters/${filterID}`,
    data: { Name, Status, Version, Simple, Tree, Sieve }
});

export const checkSieveFilter = ({ Sieve, Version } = {}) => ({
    method: 'put',
    url: 'mail/v4/filters/check',
    data: { Sieve, Version }
});

export const enableFilter = (filterID) => ({
    method: 'put',
    url: `mail/v4/filters/${filterID}/enable`
});

export const disableFilter = (filterID) => ({
    method: 'put',
    url: `mail/v4/filters/${filterID}/disable`
});

export const toggleEnable = (ID, enable = true) => (enable ? enableFilter : disableFilter)(ID);

export const deleteFilter = (filterID) => ({
    method: 'delete',
    url: `mail/v4/filters/${filterID}`
});

export const updateFilterOrder = (FilterIDs) => ({
    method: 'put',
    url: 'mail/v4/filters/order',
    data: { FilterIDs }
});
