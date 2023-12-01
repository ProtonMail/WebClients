import { groupBy } from 'lodash';

import { WalletWithAccountsWithBalanceAndTxs } from '../types';
import { WalletType } from '../types/api';

export const useBalanceDistribution = (wallets: WalletWithAccountsWithBalanceAndTxs[]) => {
    const walletsGroupedByKind = groupBy(wallets, ({ Type }) => Type);
    return Object.entries(walletsGroupedByKind).reduce((acc: Partial<Record<WalletType, number>>, [kind, wallets]) => {
        return {
            ...acc,
            // Compute each wallet types' balances
            [kind]: wallets.reduce((tBalance, wallet) => {
                // Compute each wallet's balance
                const walletBalance = wallet.accounts.reduce((acc, { balance }) => acc + Number(balance.confirmed), 0);
                return tBalance + walletBalance;
            }, 0),
        };
    }, {});
};
