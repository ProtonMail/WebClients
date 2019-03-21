import { createContext } from 'react';
import { queryDomains } from 'proton-shared/lib/api/domains';
import { useApi } from 'react-components';

import createProvider from './helpers/createProvider';
import createModelHook from './helpers/createModelHook';
import createUseModelHook from './helpers/createUseModelHook';

const useAsyncFn = () => {
    const api = useApi();
    return () => {
        return api(queryDomains()).then(({ Domains }) => Domains);
    };
};

const providerValue = createModelHook({
    useAsyncFn
});
export const DomainsContext = createContext();
export const DomainsProvider = createProvider(DomainsContext, providerValue);
export const useDomains = createUseModelHook(DomainsContext);
