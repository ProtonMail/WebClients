import { createContext, useContext, useMemo } from 'react';

import { type WasmProtonWalletApiClient } from '@proton/andromeda';

export const ExtendedApiContext = createContext<{ walletApi: WasmProtonWalletApiClient } | undefined>(undefined);

export const useWalletApi = () => {
    const extendedApiContext = useContext(ExtendedApiContext);

    if (!extendedApiContext) {
        throw new Error('extended wallet API can only be used in ExtendedApiContext');
    }

    return extendedApiContext.walletApi;
};

export const useWalletApiClients = () => {
    const walletApi = useWalletApi();
    return useMemo(() => walletApi.clients(), [walletApi]);
};
