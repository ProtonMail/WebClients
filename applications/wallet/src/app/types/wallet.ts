import { WasmAccount, WasmBalance, WasmTransactionDetails, WasmUtxo, WasmWallet } from '@proton/andromeda';

export type AccountWithChainData = {
    account: WasmAccount;
    balance?: WasmBalance;
    transactions?: WasmTransactionDetails[];
    utxos?: WasmUtxo[];
    derivationPathStr: string;
};

export type AccountChainDataByAccountId = Partial<Record<string, AccountWithChainData>>;
export type AccountIdByDerivationPathAndWalletId = Partial<Record<string, Partial<Record<string, string>>>>;

export type WalletWithChainData = {
    wallet: WasmWallet;
    accounts: AccountChainDataByAccountId;
};

export type WalletChainDataByWalletId = Partial<Record<string, WalletWithChainData>>;
