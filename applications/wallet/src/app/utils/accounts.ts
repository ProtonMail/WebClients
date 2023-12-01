import { AccountWithBalanceAndTxs } from '../types';

export const getAccountBalance = (account: AccountWithBalanceAndTxs) => {
    return Number(account.balance.confirmed);
};
