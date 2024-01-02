import { useMemo } from 'react';

import { ChartData, ChartDataset } from 'chart.js';

import { useBalanceEvolution } from '../../hooks/useBalanceEvolution';
import { WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { getNewRandomColor, getWalletBalance, getWalletTransactions } from '../../utils';

type WalletBalanceAcc = [string[], { label: string; data: number[]; backgroundColor: string[]; borderWidth: number }[]];

type BalanceDistributionChartData = ChartData<'doughnut', number[], unknown>;
type WalletBalanceEvolutionChartDataset = ChartDataset<
    'line',
    {
        x: number | string;
        y: number | string;
    }[]
>;

/**
 * When a single wallet is provided, then it returns doughnut data to show distribution accross wallet's accounts
 * When multiple wallets are provided, it returns doughnut data to display distribution accross user's wallets
 */
const formatWalletToDoughnutChart = (
    data?: WalletWithAccountsWithBalanceAndTxs | WalletWithAccountsWithBalanceAndTxs[]
) => {
    const raw = data && 'accounts' in data ? data.accounts : data;

    const init: WalletBalanceAcc = [[], [{ label: 'Balance', data: [], backgroundColor: [], borderWidth: 0 }]];

    const [labels, datasets] =
        raw?.reduce(([accLabels, [accDataset]]: WalletBalanceAcc, walletOrAccount) => {
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
        }, init) ?? init;

    return { labels, datasets };
};

/**
 * Returns balance overview either for Single wallet dashboard or Many wallets ones
 */
export const useBalanceOverview = (
    data?: WalletWithAccountsWithBalanceAndTxs | WalletWithAccountsWithBalanceAndTxs[]
) => {
    const [transactions, totalBalance, dataCount] = Array.isArray(data)
        ? [
              data.flatMap((wallet) => getWalletTransactions(wallet)),
              data.reduce((acc, wallet) => acc + getWalletBalance(wallet), 0),
              data.length ?? 0,
          ]
        : [getWalletTransactions(data), getWalletBalance(data), data?.accounts.length ?? 0];

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
        dataCount,
        last7DaysBalanceDifference,
        balanceDistributionDoughnutChartData,
        balanceEvolutionLineChartData,
    };
};
