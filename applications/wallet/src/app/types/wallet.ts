import { IWasmWallet } from '.';
import {
    IWasmSimpleTransactionArray,
    IWasmUtxoArray,
    WasmAccount,
    WasmBalance,
    WasmWallet,
    WasmWalletAccount,
} from '../../pkg';

export type AccountWithBlockchainData = WasmWalletAccount & {
    balance: WasmBalance;
    transactions: IWasmSimpleTransactionArray;
    utxos: IWasmUtxoArray;
    wasmAccount: WasmAccount;
};

export type WalletWithAccountsWithBalanceAndTxs = IWasmWallet & {
    wasmWallet: WasmWallet;
    accounts: AccountWithBlockchainData[];
};

export type BlockchainAccountRecord = Partial<Record<string, AccountWithBlockchainData>>;

export type BlockchainWalletRecord = Partial<
    Record<
        string,
        IWasmWallet & {
            wasmWallet: WasmWallet;
            accounts: BlockchainAccountRecord;
        }
    >
>;
