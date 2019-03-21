import { createContext } from 'react';
import { getOrganization } from 'proton-shared/lib/api/organization';
import { useApi } from 'react-components';

import createProvider from './helpers/createProvider';
import createModelHook from './helpers/createModelHook';
import createUseModelHook from './helpers/createUseModelHook';

const useAsyncFn = () => {
    const api = useApi();
    return () => {
        return api(getOrganization()).then(({ Organization }) => Organization);
    };
};

const providerValue = createModelHook({
    useAsyncFn
});
export const OrganizationContext = createContext();
export const OrganizationProvider = createProvider(OrganizationContext, providerValue);
export const useOrganization = createUseModelHook(OrganizationContext);
