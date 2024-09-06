import { WasmNetwork } from '@proton/andromeda';

export const BLOCKCHAIN_EXPLORER_BASE_URL_BY_NETWORK: Partial<Record<WasmNetwork, string>> = {
    [WasmNetwork.Bitcoin]: 'https://proton.me/wallet/explorer/tx',
    [WasmNetwork.Regtest]: 'https://mempool.wallet-regtest.proton.black/tx',
};
