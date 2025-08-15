export const queryDomains = (params?: { Page: number; PageSize: number }) => ({
    url: 'domains',
    method: 'get',
    params,
});

export const getDomain = (domainID: string, refresh: boolean) => ({
    url: `domains/${domainID}`,
    method: 'get',
    params: { Refresh: +refresh },
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

export const addDomain = (data: { Name: string; AllowedForSSO?: boolean; AllowedForMail?: boolean }) => ({
    url: 'domains',
    method: 'post',
    data,
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
