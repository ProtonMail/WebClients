import { AccountWithBlockchainData, WalletWithAccountsWithBalanceAndTxs } from '../types';

export const getAccountBalance = (account: AccountWithBlockchainData) => {
    return Number(account.balance.confirmed);
};

export const getDefaultAccount = (
    wallet?: WalletWithAccountsWithBalanceAndTxs
): AccountWithBlockchainData | undefined => wallet?.accounts?.[0];

export const getSelectedAccount = (
    wallet?: WalletWithAccountsWithBalanceAndTxs,
    accountId?: number
): AccountWithBlockchainData | undefined =>
    wallet?.accounts?.find?.(({ WalletAccountID }) => WalletAccountID === accountId);
