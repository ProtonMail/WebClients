import { IWasmWallet } from '.';
import { IWasmSimpleTransactionArray, IWasmUtxoArray, WasmAccount, WasmBalance, WasmWallet } from '../../pkg';
import { WalletAccount } from './api';

export type AccountWithBlockchainData = WalletAccount & {
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
