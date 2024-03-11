import { ComponentProps } from 'react';

import { WasmProtonWalletApiClient } from '@proton/andromeda';
import ApiProvider from '@proton/components/containers/api/ApiProvider';

import { ExtendedApiContext } from '.';

const ExtendedApiProvider = ({
    api,
    walletApi,
    children,
}: ComponentProps<typeof ApiProvider> & { walletApi: WasmProtonWalletApiClient }) => {
    return (
        <ExtendedApiContext.Provider value={{ walletApi }}>
            <ApiProvider api={api}>{children}</ApiProvider>
        </ExtendedApiContext.Provider>
    );
};

export default ExtendedApiProvider;
