import { WasmBlockchainClient } from '@proton/andromeda';
import { useWalletApi } from '@proton/wallet';

export const useBlockchainClient = () => {
    const walletApi = useWalletApi();
    return new WasmBlockchainClient(walletApi);
};
