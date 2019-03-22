import { createContext } from 'react';
import { queryDomains, queryDomainAddresses } from 'proton-shared/lib/api/domains';
import { useApi } from 'react-components';

import createProvider from './helpers/createProvider';
import createModelHook from './helpers/createModelHook';
import createUseModelHook from './helpers/createUseModelHook';

const useAsyncFn = () => {
    const api = useApi();
    return async () => {
        const Domains = await api(queryDomains()).then(({ Domains }) => Domains);
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
};

const providerValue = createModelHook({
    useAsyncFn
});
export const DomainsContext = createContext();
export const DomainsProvider = createProvider(DomainsContext, providerValue);
export const useDomains = createUseModelHook(DomainsContext);
