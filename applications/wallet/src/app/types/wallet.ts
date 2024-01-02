import { IWasmSimpleTransactionArray, IWasmUtxoArray, WasmAccount, WasmBalance, WasmWallet } from '../../pkg';
import { Wallet, WalletAccount } from './api';

export type AccountWithBlockchainData = WalletAccount & {
    balance: WasmBalance;
    transactions: IWasmSimpleTransactionArray;
    utxos: IWasmUtxoArray;
    wasmAccount: WasmAccount;
};

export type WalletWithAccountsWithBalanceAndTxs = Wallet & {
    wasmWallet: WasmWallet;
    accounts: AccountWithBlockchainData[];
};

export type BlockchainAccountRecord = Partial<Record<string, AccountWithBlockchainData>>;

export type BlockchainWalletRecord = Partial<
    Record<
        string,
        Wallet & {
            wasmWallet: WasmWallet;
            accounts: BlockchainAccountRecord;
        }
    >
>;
