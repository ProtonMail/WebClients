import { queryDomains } from '../api/domains';
import updateCollection from '../helpers/updateCollection';

export const getDomainsModel = (api) => {
    return api(queryDomains()).then(({ Domains }) => Domains);
};

export const DomainsModel = {
    key: 'Domains',
    get: getDomainsModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Domain }) => Domain }),
};
