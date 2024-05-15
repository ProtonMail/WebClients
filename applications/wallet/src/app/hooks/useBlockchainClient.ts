import { WasmBlockchainClient } from '@proton/andromeda';
import { useWalletApi } from '@proton/wallet';

export const useBlockchainClient = () => {
    const api = useWalletApi();
    return new WasmBlockchainClient(api);
};
