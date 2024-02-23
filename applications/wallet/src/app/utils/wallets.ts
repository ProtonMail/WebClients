import { WalletWithAccountsWithBalanceAndTxs } from '../types';
import { getAccountBalance } from './accounts';

export const getWalletBalance = (wallet?: WalletWithAccountsWithBalanceAndTxs) => {
    return wallet?.accounts.reduce((acc, account) => acc + getAccountBalance(account), 0) ?? 0;
};

export const getWalletTransactions = (wallet?: WalletWithAccountsWithBalanceAndTxs) => {
    return wallet?.accounts.flatMap(({ transactions }) => transactions) ?? [];
};

export const getSelectedWallet = (
    wallets?: WalletWithAccountsWithBalanceAndTxs[],
    walletId?: string
): WalletWithAccountsWithBalanceAndTxs | undefined =>
    wallets?.find(({ Wallet }) => walletId === Wallet.ID) ?? wallets?.[0];
