import { WasmAccount, WasmBalance, WasmSimpleTransaction, WasmUtxo } from '../../pkg';
import { Wallet, WalletAccount } from './api';

export type AccountWithBlockchainData = WalletAccount & {
    balance: WasmBalance;
    transactions: WasmSimpleTransaction[];
    utxos: WasmUtxo[];
    wasmAccount: WasmAccount;
};

export type WalletWithAccountsWithBalanceAndTxs = Wallet & {
    accounts: AccountWithBlockchainData[];
};

export type BlockchainAccountRecord = Partial<Record<string, AccountWithBlockchainData>>;

export type BlockchainWalletRecord = Partial<
    Record<
        string,
        Wallet & {
            accounts: BlockchainAccountRecord;
        }
    >
>;
