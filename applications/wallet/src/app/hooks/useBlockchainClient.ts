import { useMemo } from 'react';

import { WasmBlockchainClient } from '@proton/andromeda';
import { useWalletApi } from '@proton/wallet/contexts/ExtendedApiContext';

export const useBlockchainClient = () => {
    const api = useWalletApi();
    return useMemo(() => new WasmBlockchainClient(api), [api]);
};
