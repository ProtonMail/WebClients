import { queryDomains } from '../api/domains';
import updateCollection from '../helpers/updateCollection';
import queryPagesThrottled from '../api/helpers/queryPagesThrottled';

export const getDomainsModel = (api) => {
    const pageSize = 100;

    const requestPage = (page) => {
        return api(
            queryDomains({
                Page: page,
                PageSize: pageSize,
            })
        );
    };

    return queryPagesThrottled({
        requestPage,
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
