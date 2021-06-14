import { queryDomainAddresses } from 'proton-shared/lib/api/domains';
import { cachedPromise } from './helpers/cachedPromise';
import usePromiseResult from './usePromiseResult';
import useCache from './useCache';
import useApi from './useApi';

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
                        return api(queryDomainAddresses(domain.ID)).then(({ Addresses = [] }) => Addresses);
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
