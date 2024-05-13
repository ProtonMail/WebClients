import React, { ReactNode, useEffect } from 'react';

import { WasmProtonWalletApiClient } from '@proton/andromeda';
import ExtendedApiProvider from '@proton/wallet/contexts/ExtendedApiContext/ExtendedApiProvider';

import { extendStore } from '../../store/store';
import { extraThunkArguments } from '../../store/thunk';

const WalletExtendedApiContext = ({ children }: { children: ReactNode }) => {
    useEffect(() => {
        
        const walletApi = new WasmProtonWalletApiClient(extraThunkArguments.authentication.UID, window.location.origin);
        extendStore({ walletApi });
    }, []);

    return (
        <ExtendedApiProvider api={extraThunkArguments.api} walletApi={extraThunkArguments.walletApi}>
            {children}
        </ExtendedApiProvider>
    );
};

export default WalletExtendedApiContext;
