import { WasmBalance, WasmSimpleTransaction } from '../../pkg';
import { Wallet as ApiWallet, WalletAccount } from './api';

export type AccountWithBalanceAndTxs = WalletAccount & {
    balance: WasmBalance;
    transactions: WasmSimpleTransaction[];
};

export type WalletWithAccountsWithBalanceAndTxs = ApiWallet & {
    accounts: AccountWithBalanceAndTxs[];
};

export type WalletWithAccounts = ApiWallet & {
    accounts: WalletAccount[];
};
