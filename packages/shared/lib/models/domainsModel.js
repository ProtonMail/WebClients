import { queryDomains } from '../api/domains';
import updateCollection from '../helpers/updateCollection';
import queryPagesThrottled from '../api/helpers/queryPagesThrottled';

export const getDomainsModel = (api) => {
    const pageSize = 50;

    return queryPagesThrottled({
        requestPage: (page) => {
            return api(
                queryDomains({
                    Page: page,
                    PageSize: pageSize,
                })
            );
        },
        pageSize,
        pagesPerChunk: 10,
        delayPerChunk: 100,
    }).then((pages) => {
        return pages.map(({ Domains }) => Domains).flat();
    });
};

export const DomainsModel = {
    key: 'Domains',
    get: getDomainsModel,
    update: (model, events) => updateCollection({ model, events, item: ({ Domain }) => Domain }),
};
