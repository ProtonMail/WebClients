import { ReactNode } from 'react';

import { WasmProtonWalletApiClient } from '@proton/andromeda';

import { ExtendedApiContext } from '.';

const ExtendedApiProvider = ({
    walletApi,
    children,
}: {
    walletApi: WasmProtonWalletApiClient;
    children: ReactNode;
}) => {
    return <ExtendedApiContext.Provider value={{ walletApi }}>{children}</ExtendedApiContext.Provider>;
};

export default ExtendedApiProvider;
