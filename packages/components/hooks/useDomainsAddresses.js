import { queryDomainAddresses } from '@proton/shared/lib/api/domains';
import queryPages from '@proton/shared/lib/api/helpers/queryPages';
import { cachedPromise } from './helpers/cachedPromise';
import usePromiseResult from './usePromiseResult';
import useCache from './useCache';
import useApi from './useApi';

export const getAllDomainAddresses = (api, domainID) => {
    return queryPages((page, pageSize) => {
        return api(
            queryDomainAddresses(domainID, {
                Page: page,
                PageSize: pageSize,
            })
        );
    }).then((pages) => {
        return pages.flatMap(({ Addresses = [] }) => Addresses);
    });
};

const useDomainsAddresses = (domains) => {
    const cache = useCache();
    const api = useApi();

    return usePromiseResult(async () => {
        if (!Array.isArray(domains)) {
            return;
        }

        const domainAddresses = await Promise.all(
            domains.map((domain) => {
                return cachedPromise(
                    cache,
                    `${domain.ID}`,
                    () => {
                        return getAllDomainAddresses(api, domain.ID);
                    },
                    domain
                );
            })
        );

        return domains.reduce((acc, { ID }, i) => {
            return {
                ...acc,
                [ID]: domainAddresses[i],
            };
        }, {});
    }, [domains]);
};

export default useDomainsAddresses;
