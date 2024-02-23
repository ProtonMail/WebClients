import { createContext, useContext } from 'react';

import { WasmProtonWalletApiClient } from '../../../pkg';

export const ExtendedApiContext = createContext<{ rustApi: WasmProtonWalletApiClient }>({
    rustApi: new WasmProtonWalletApiClient(),
});

export const useRustApi = () => {
    return useContext(ExtendedApiContext).rustApi;
};
