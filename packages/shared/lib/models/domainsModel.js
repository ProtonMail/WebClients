import { queryDomains, queryDomainAddresses } from '../api/domains';
import updateCollection from '../helpers/updateCollection';

export const updateDomainsModel = (api, Domains) => {
    return Promise.all(
        Domains.map(async (domain) => {
            const { Addresses = [] } = await api(queryDomainAddresses(domain.ID));
            return {
                ...domain,
                addresses: Addresses
            };
        })
    );
};

export const getDomainsModel = (api) => {
    return api(queryDomains()).then(({ Domains }) => updateDomainsModel(api, Domains));
};

export const DomainsModel = {
    key: 'Domains',
    get: getDomainsModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Domain }) => Domain }),
    sync: updateDomainsModel
};
