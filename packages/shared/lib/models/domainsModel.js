import { queryDomains } from '../api/domains';
import queryPages from '../api/helpers/queryPages';
import updateCollection from '../helpers/updateCollection';

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
    update: (model, events) => updateCollection({ model, events, itemKey: 'Domain' }),
};
