import { useMemo } from 'react';

import { ChartDataset } from 'chart.js';

import { WasmTransactionDetails } from '@proton/andromeda';
import { IWasmApiWalletData } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../../contexts';
import { useBalanceEvolution } from '../../hooks/useBalanceEvolution';
import { WalletChainDataByWalletId } from '../../types';
import {
    getAccountBalance,
    getAccountWithChainDataFromManyWallets,
    getNewRandomColor,
    getWalletBalance,
    getWalletTransactions,
} from '../../utils';
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
    walletsChainData: WalletChainDataByWalletId,
    colors: string[],
    apiData?: IWasmApiWalletData | IWasmApiWalletData[]
): DoughnutChartData => {
    if (!apiData) {
        return [];
    }

    if ('WalletAccounts' in apiData) {
        return apiData.WalletAccounts.reduce((acc: DoughnutChartData, account, index) => {
            const maybeAccount = getAccountWithChainDataFromManyWallets(
                walletsChainData,
                apiData.Wallet.ID,
                account.ID
            );

            return [...acc, [getAccountBalance(maybeAccount), colors[index], account.Label]];
        }, []);
    }

    return apiData.reduce((acc: DoughnutChartData, wallet, index) => {
        const balance = Number(getWalletBalance(walletsChainData, wallet.Wallet.ID));
        return [...acc, [balance, colors[index], wallet.Wallet.Name]];
    }, []);
};

const getBalanceOverviewData = (
    walletsChainData: WalletChainDataByWalletId,
    apiData?: IWasmApiWalletData | IWasmApiWalletData[]
): [WasmTransactionDetails[], number, number] => {
    if (Array.isArray(apiData)) {
        return [
            apiData.flatMap((wallet) => getWalletTransactions(walletsChainData, wallet.Wallet.ID)),
            apiData.reduce((acc, wallet) => acc + getWalletBalance(walletsChainData, wallet.Wallet.ID), 0),
            apiData.length ?? 0,
        ];
    }

    if (apiData) {
        return [
            getWalletTransactions(walletsChainData, apiData.Wallet.ID),
            getWalletBalance(walletsChainData, apiData.Wallet.ID),
            apiData?.WalletAccounts.length ?? 0,
        ];
    }

    return [[], 0, 0];
};

const computeColors = (apiData?: IWasmApiWalletData | IWasmApiWalletData[]) => {
    if (!apiData) {
        return [];
    }

    if ('WalletAccounts' in apiData) {
        return apiData.WalletAccounts.reduce((acc: string[]) => {
            return [...acc, getNewRandomColor(acc)];
        }, []);
    }

    return apiData.reduce((acc: string[]) => {
        return [...acc, getNewRandomColor(acc)];
    }, []);
};

/**
 * Returns balance overview either for Single wallet dashboard or Many wallets ones
 */
export const useBalanceOverview = (apiData?: IWasmApiWalletData | IWasmApiWalletData[]) => {
    const { walletsChainData } = useBitcoinBlockchainContext();

    const [transactions, totalBalance, dataCount] = getBalanceOverviewData(walletsChainData, apiData);

    const colors = useMemo(() => computeColors(apiData), [apiData]);

    const balanceDistributionDoughnutChartData: DoughnutChartData = useMemo(
        () => formatWalletToDoughnutChart(walletsChainData, colors, apiData),
        [walletsChainData, colors, apiData]
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
