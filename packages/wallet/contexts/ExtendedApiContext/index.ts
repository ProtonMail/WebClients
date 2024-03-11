import { createContext, useContext } from 'react';

import { WasmProtonWalletApiClient } from '@proton/andromeda';

export const ExtendedApiContext = createContext<{ walletApi: WasmProtonWalletApiClient }>({
    walletApi: new WasmProtonWalletApiClient(),
});

export const useWalletApi = () => {
    return useContext(ExtendedApiContext).walletApi;
};
