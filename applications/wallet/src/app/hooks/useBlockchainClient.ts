import { useMemo } from 'react';

import { WasmBlockchainClient } from '@proton/andromeda';
import { useWalletApi } from '@proton/wallet';

export const useBlockchainClient = () => {
    const api = useWalletApi();
    return useMemo(() => new WasmBlockchainClient(api), [api]);
};
