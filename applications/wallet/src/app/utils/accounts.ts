import { AccountWithBlockchainData, WalletWithAccountsWithBalanceAndTxs } from '../types';

export const getAccountBalance = (account: AccountWithBlockchainData) => {
    return Number(account.balance.confirmed);
};

export const getDefaultAccount = (
    wallet?: WalletWithAccountsWithBalanceAndTxs
): AccountWithBlockchainData | undefined => wallet?.accounts?.[0];

export const getSelectedAccount = (
    wallet?: WalletWithAccountsWithBalanceAndTxs,
    accountId?: string
): AccountWithBlockchainData | undefined => wallet?.accounts?.find?.(({ ID }) => ID === accountId);
