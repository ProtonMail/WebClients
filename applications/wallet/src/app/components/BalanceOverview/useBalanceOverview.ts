import { useMemo } from 'react';

import { ChartDataset } from 'chart.js';

import { useBalanceEvolution } from '../../hooks/useBalanceEvolution';
import { WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { getNewRandomColor, getWalletBalance, getWalletTransactions } from '../../utils';
import { DoughnutChartData } from '../charts/DoughnutChart';

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
): DoughnutChartData => {
    const raw = data && 'accounts' in data ? data.accounts : data;

    const chartData = (raw ?? []).reduce((acc: DoughnutChartData, walletOrAccount) => {
        const [label, balance] =
            'accounts' in walletOrAccount
                ? [walletOrAccount.Name, getWalletBalance(walletOrAccount)]
                : [walletOrAccount.Label, Number(walletOrAccount.balance.confirmed)];

        const color = getNewRandomColor(acc.map(([, color]) => color));

        return [...acc, [balance, color, label] as [number, string, string]];
    }, []);

    return chartData;
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

    const balanceDistributionDoughnutChartData: DoughnutChartData = useMemo(
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
