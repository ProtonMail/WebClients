import { WasmAccount, WasmBalance, WasmTransactionDetails, WasmUtxo, WasmWallet } from '@proton/andromeda';

export type AccountWithChainData = {
    account: WasmAccount;
    balance?: WasmBalance;
    transactions?: WasmTransactionDetails[];
    utxos?: WasmUtxo[];
};

export type AccountChainDataByAccountId = Partial<Record<string, AccountWithChainData>>;

export type WalletWithChainData = {
    wallet: WasmWallet;
    accounts: AccountChainDataByAccountId;
};

export type WalletChainDataByWalletId = Partial<Record<string, WalletWithChainData>>;
