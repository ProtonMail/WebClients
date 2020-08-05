export const queryDomains = () => ({
    url: 'domains',
    method: 'get',
});

export const getDomain = (domainID) => ({
    url: `domains/${domainID}`,
    method: 'get',
});

export const queryDomainAddresses = (domainID) => ({
    url: `domains/${domainID}/addresses`,
    method: 'get',
});

export const queryAvailableDomains = () => ({
    url: 'domains/available',
    method: 'get',
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
