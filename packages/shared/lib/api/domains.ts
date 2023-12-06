export const queryDomains = (params?: { Page: number; PageSize: number }) => ({
    url: 'domains',
    method: 'get',
    params,
});

export const getDomain = (domainID: string) => ({
    url: `domains/${domainID}`,
    method: 'get',
});

export const queryDomainAddresses = (domainID: string, params?: { Page: number; PageSize: number }) => ({
    url: `domains/${domainID}/addresses`,
    method: 'get',
    params,
});

export const queryAvailableDomains = (Type?: string) => ({
    url: 'domains/available',
    method: 'get',
    params: { Type },
});

export const queryPremiumDomains = () => ({
    url: 'domains/premium',
    method: 'get',
});

export const addDomain = (Name: string) => ({
    url: 'domains',
    method: 'post',
    data: { Name },
});

export const updateCatchAll = (domainID: string, AddressID: string | null) => ({
    url: `domains/${domainID}/catchall`,
    method: 'put',
    data: { AddressID },
});

export const deleteDomain = (domainID: string) => ({
    url: `domains/${domainID}`,
    method: 'delete',
});
