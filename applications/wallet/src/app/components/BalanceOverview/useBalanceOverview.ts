import { useMemo } from 'react';

import { ChartData, ChartDataset } from 'chart.js';

import { getRandomAccentColor } from '@proton/shared/lib/colors';

import { useBalanceEvolution } from '../../hooks/useBalanceEvolution';
import { Transaction, Wallet } from '../../types';

type WalletBalanceAcc = [string[], { label: string; data: number[]; backgroundColor: string[]; borderWidth: number }[]];

const formatWalletToDoughnutChart = (wallets: Wallet[]) => {
    const [labels, datasets] = wallets.reduce(
        ([accLabels, [accDataset]]: WalletBalanceAcc, wallet) => {
            const label = wallet.name;
            let color = getRandomAccentColor();
            let tries = 0;
            while (accDataset.backgroundColor.includes(color) && tries < 3) {
                color = getRandomAccentColor();
                tries++;
            }

            return [
                [...accLabels, label],
                [
                    {
                        ...accDataset,
                        data: [...accDataset.data, wallet.balance],
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

export const useBalanceOverview = (wallets: Wallet[], transactions: Transaction[]) => {
    const totalBalance = wallets.reduce((acc, wallet) => acc + wallet.balance, 0);

    const balanceDistributionDoughnutChartData: ChartData<'doughnut', number[], unknown> = useMemo(
        () => formatWalletToDoughnutChart(wallets),
        [wallets]
    );

    const { evolutionByDay, balanceDifference: last7DaysBalanceDifference } = useBalanceEvolution(
        totalBalance,
        transactions
    );

    const balanceEvolutionLineChartData: ChartDataset<
        'line',
        {
            x: number | string;
            y: number | string;
        }[]
    > = useMemo(() => ({ data: evolutionByDay.map(({ balance, day }) => ({ x: day, y: balance })) }), [evolutionByDay]);

    return {
        totalBalance,
        last7DaysBalanceDifference,
        balanceDistributionDoughnutChartData,
        balanceEvolutionLineChartData,
    };
};
