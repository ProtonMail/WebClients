import { WasmAccount, WasmBalance, WasmSimpleTransaction, WasmUtxo } from '../../pkg';
import { Wallet as ApiWallet, WalletAccount } from './api';

export type AccountWithBlockchainData = WalletAccount & {
    balance: WasmBalance;
    transactions: WasmSimpleTransaction[];
    utxos: WasmUtxo[];
    wasmAccount: WasmAccount;
};

export type WalletWithAccountsWithBalanceAndTxs = ApiWallet & {
    accounts: AccountWithBlockchainData[];
};

export type BlockchainAccountRecord = Partial<Record<string, AccountWithBlockchainData>>;

export type BlockchainWalletRecord = Partial<
    Record<
        string,
        ApiWallet & {
            accounts: BlockchainAccountRecord;
        }
    >
>;

export type WalletWithAccounts = ApiWallet & {
    accounts: WalletAccount[];
};
