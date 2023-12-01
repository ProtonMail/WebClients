import { WasmBalance, WasmSimpleTransaction } from '../../pkg';
import { Wallet as ApiWallet, WalletAccount } from './api';
import { WalletKind } from './walletKind';

export interface Wallet {
    kind: WalletKind;
    name: string;
    id: string;
    balance: number;
}

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
