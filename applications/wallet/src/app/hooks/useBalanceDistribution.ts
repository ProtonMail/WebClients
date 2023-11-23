import { groupBy } from 'lodash';

import { Wallet, WalletKind } from '../types';

export const useBalanceDistribution = (wallets: Wallet[]) => {
    const walletsGroupedByKind = groupBy(wallets, ({ kind }) => kind);
    return Object.entries(walletsGroupedByKind).reduce(
        (acc: Partial<Record<WalletKind, number>>, [kind, wallets]) => ({
            ...acc,
            [kind]: wallets.reduce((tBalance, wallet) => tBalance + wallet.balance, 0),
        }),
        {}
    );
};
