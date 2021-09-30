export const queryDomains = (params) => ({
    url: 'domains',
    method: 'get',
    params,
});

export const getDomain = (domainID) => ({
    url: `domains/${domainID}`,
    method: 'get',
});

export const queryDomainAddresses = (domainID, params) => ({
    url: `domains/${domainID}/addresses`,
    method: 'get',
    params,
});

export const queryAvailableDomains = (Type) => ({
    url: 'domains/available',
    method: 'get',
    params: { Type },
});

export const queryPremiumDomains = () => ({
    url: 'domains/premium',
    method: 'get',
});

export const addDomain = (Name) => ({
    url: 'domains',
    method: 'post',
    data: { Name },
});

export const updateCatchAll = (domainID, AddressID) => ({
    url: `domains/${domainID}/catchall`,
    method: 'put',
    data: { AddressID },
});

export const deleteDomain = (domainID) => ({
    url: `domains/${domainID}`,
    method: 'delete',
});
