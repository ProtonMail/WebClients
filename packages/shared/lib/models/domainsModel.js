import { queryDomains } from '../api/domains';
import updateCollection from '../helpers/updateCollection';
import queryPages from '../api/helpers/queryPages';

export const getDomainsModel = (api) => {
    return queryPages((page, pageSize) => {
        return api(
            queryDomains({
                Page: page,
                PageSize: pageSize,
            })
        );
    }).then((pages) => {
        return pages.flatMap(({ Domains }) => Domains);
    });
};

export const DomainsModel = {
    key: 'Domains',
    get: getDomainsModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Domain }) => Domain }),
};
