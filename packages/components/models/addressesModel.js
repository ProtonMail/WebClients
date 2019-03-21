import { createContext } from 'react';
import { queryAddresses } from 'proton-shared/lib/api/addresses';
import { useApi } from 'react-components';

import createProvider from './helpers/createProvider';
import createModelHook from './helpers/createModelHook';
import createUseModelHook from './helpers/createUseModelHook';

const useAsyncFn = () => {
    const api = useApi();
    return () => {
        return api(queryAddresses()).then(({ Addresses }) => Addresses);
    };
};

const providerValue = createModelHook({
    useAsyncFn
});
export const AddressesContext = createContext();
export const AddressesProvider = createProvider(AddressesContext, providerValue);
export const useAddresses = createUseModelHook(AddressesContext);
