import { createContext, useContext } from 'react';

import { WasmProtonWalletApiClient } from '@proton/andromeda';

export const ExtendedApiContext = createContext<{ rustApi: WasmProtonWalletApiClient }>({
    rustApi: new WasmProtonWalletApiClient(),
});

export const useRustApi = () => {
    return useContext(ExtendedApiContext).rustApi;
};
