import { ComponentProps } from 'react';

import ApiProvider from '@proton/components/containers/api/ApiProvider';

import { ExtendedApiContext } from '.';
import { WasmProtonWalletApiClient } from '../../../pkg';

const ExtendedApiProvider = ({
    api,
    rustApi,
    children,
}: ComponentProps<typeof ApiProvider> & { rustApi: WasmProtonWalletApiClient }) => {
    return (
        <ExtendedApiContext.Provider value={{ rustApi }}>
            <ApiProvider api={api}>{children}</ApiProvider>
        </ExtendedApiContext.Provider>
    );
};

export default ExtendedApiProvider;
