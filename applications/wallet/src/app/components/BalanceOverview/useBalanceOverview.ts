import { useMemo } from 'react';

import { ChartData, ChartDataset } from 'chart.js';

import { getRandomAccentColor } from '@proton/shared/lib/colors';

import { useBalanceEvolution } from '../../hooks/useBalanceEvolution';
import { WalletWithAccountsWithBalanceAndTxs } from '../../types';

type WalletBalanceAcc = [string[], { label: string; data: number[]; backgroundColor: string[]; borderWidth: number }[]];

type BalanceDistributionChartData = ChartData<'doughnut', number[], unknown>;
type WalletBalanceEvolutionChartDataset = ChartDataset<
    'line',
    {
        x: number | string;
        y: number | string;
    }[]
>;

const getWalletBalance = (wallet: WalletWithAccountsWithBalanceAndTxs) => {
    return wallet.accounts.reduce((acc, cur) => acc + Number(cur.balance.confirmed), 0);
};

const getWalletTransactions = (wallet: WalletWithAccountsWithBalanceAndTxs) => {
    return wallet.accounts.flatMap(({ transactions }) => transactions);
};

const getNewRandomColor = (backgroundColors: string[]) => {
    let color = getRandomAccentColor();
    let tries = 0;
    while (backgroundColors.includes(color) && tries < 3) {
        color = getRandomAccentColor();
        tries++;
    }

    return color;
};

/**
 * When a single wallet is provided, then it returns doughnut data to show distribution accross wallet's accounts
 * When multiple wallets are provided, it returns doughnut data to display distribution accross user's wallets
 */
const formatWalletToDoughnutChart = (
    data: WalletWithAccountsWithBalanceAndTxs | WalletWithAccountsWithBalanceAndTxs[]
) => {
    const raw = 'accounts' in data ? data.accounts : data;

    const [labels, datasets] = raw.reduce(
        ([accLabels, [accDataset]]: WalletBalanceAcc, walletOrAccount) => {
            const [label, balance] =
                'accounts' in walletOrAccount
                    ? [walletOrAccount.Name, getWalletBalance(walletOrAccount)]
                    : [walletOrAccount.Label, Number(walletOrAccount.balance.confirmed)];

            const color = getNewRandomColor(accDataset.backgroundColor);

            return [
                [...accLabels, label],
                [
                    {
                        ...accDataset,
                        data: [...accDataset.data, balance],
                        backgroundColor: [...accDataset.backgroundColor, color],
                        cutout: '70%',
                    },
                ],
            ];
        },
        [[], [{ label: 'Balance', data: [], backgroundColor: [], borderWidth: 0 }]]
    );

    return { labels, datasets };
};

/**
 * Returns balance overview either for Single wallet dashboard or Many wallets ones
 */
export const useBalanceOverview = (
    data: WalletWithAccountsWithBalanceAndTxs | WalletWithAccountsWithBalanceAndTxs[]
) => {
    const [transactions, totalBalance] = Array.isArray(data)
        ? [
              data.flatMap((wallet) => getWalletTransactions(wallet)),
              data.reduce((acc, wallet) => acc + getWalletBalance(wallet), 0),
          ]
        : [getWalletTransactions(data), getWalletBalance(data)];

    const balanceDistributionDoughnutChartData: BalanceDistributionChartData = useMemo(
        () => formatWalletToDoughnutChart(data),
        [data]
    );

    const { evolutionByDay, balanceDifference: last7DaysBalanceDifference } = useBalanceEvolution(
        totalBalance,
        transactions
    );

    const balanceEvolutionLineChartData: WalletBalanceEvolutionChartDataset = useMemo(
        () => ({ data: evolutionByDay.map(({ balance, day }) => ({ x: day, y: balance })) }),
        [evolutionByDay]
    );

    return {
        totalBalance,
        transactions,
        last7DaysBalanceDifference,
        balanceDistributionDoughnutChartData,
        balanceEvolutionLineChartData,
    };
};
