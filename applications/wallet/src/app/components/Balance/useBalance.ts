import { useEffect, useMemo, useState } from 'react';

import type { ChartDataset } from 'chart.js';
import { format, sub } from 'date-fns';
import groupBy from 'lodash/groupBy';

import type { WasmApiWalletAccount, WasmTransactionDetails } from '@proton/andromeda';
import type { IWasmApiWalletData } from '@proton/wallet';

import { useBitcoinBlockchainContext } from '../../contexts';
import type { WalletChainDataByWalletId } from '../../types';
import {
    getAccountBalance,
    getAccountTransactions,
    getAccountWithChainDataFromManyWallets,
    getWalletBalance,
    getWalletTransactions,
    transactionTime,
} from '../../utils';

type WalletBalanceEvolutionChartDataset = ChartDataset<
    'line',
    {
        x: number | string;
        y: number | string;
    }[]
>;

const getBalanceData = async (
    walletsChainData: WalletChainDataByWalletId,
    apiData: IWasmApiWalletData,
    apiAccount?: WasmApiWalletAccount
): Promise<[WasmTransactionDetails[], number, number]> => {
    if (apiAccount) {
        const accountChainData = getAccountWithChainDataFromManyWallets(
            walletsChainData,
            apiData.Wallet.ID,
            apiAccount.ID
        );

        return [
            await getAccountTransactions(walletsChainData, apiData.Wallet.ID, apiAccount.ID),
            await getAccountBalance(accountChainData),
            1,
        ];
    }

    return [
        await getWalletTransactions(walletsChainData, apiData.Wallet.ID),
        await getWalletBalance(walletsChainData, apiData.Wallet.ID),
        apiData?.WalletAccounts.length ?? 0,
    ];
};

type BalanceEvolutionByDayChartData = {
    balance: number;
    day: number;
}[];

/**
 * Returns balance overview either for Single wallet dashboard or Many wallets ones
 */
export const useBalance = (apiData: IWasmApiWalletData, apiAccount?: WasmApiWalletAccount) => {
    const { walletsChainData } = useBitcoinBlockchainContext();

    const [[transactions, currentBalance, dataCount], setData] = useState<Awaited<ReturnType<typeof getBalanceData>>>([
        [],
        0,
        0,
    ]);

    useEffect(() => {
        void getBalanceData(walletsChainData, apiData, apiAccount).then((d) => {
            setData(d);
        });
    }, [walletsChainData, apiData, apiAccount]);

    /**
     * Balance evolution from oldest transaction day to newest one
     */
    const evolutionByDay: BalanceEvolutionByDayChartData = useMemo(() => {
        if (!transactions.length) {
            // CHart.js needs to elements in the array to draw the chart
            return new Array(2).fill({ balance: currentBalance, day: format(new Date(), 'MM/dd/yyyy') });
        }

        const today = new Date();
        const lastThirtyDays = new Array(30).fill(null).map((_, index) => {
            const day = sub(today, { days: index });
            return format(day, 'MM/dd/yyyy');
        });

        const txGroupedByDay = groupBy(transactions, (tx) => {
            const date = new Date(transactionTime(tx));
            return format(date, 'MM/dd/yyyy');
        });

        const [mostRecentDay] = lastThirtyDays;
        const newAcc = lastThirtyDays.reduce(
            (acc, day) => {
                const txs = txGroupedByDay[day];
                const [lastAccDay] = acc;

                const dayBalance =
                    txs?.reduce((acc, tx) => {
                        const txValue = Number(tx.received) - Number(tx.sent);
                        return acc + Number(txValue);
                    }, 0) ?? 0;
                return [{ balance: lastAccDay.balance - dayBalance, day }, ...acc];
            },
            [{ balance: currentBalance, day: mostRecentDay }]
        );

        return newAcc;
    }, [currentBalance, transactions]);

    const [firstDayBalance] = evolutionByDay;
    const lastDayBalance = evolutionByDay[evolutionByDay.length - 1];
    const balanceDifference = lastDayBalance.balance - firstDayBalance.balance;

    const balanceEvolutionLineChartData: WalletBalanceEvolutionChartDataset = useMemo(
        () => ({ data: evolutionByDay.map(({ balance, day }) => ({ x: day, y: balance })) }),
        [evolutionByDay]
    );

    return {
        totalBalance: currentBalance,
        transactions,
        dataCount,
        balanceDifference,
        balanceEvolutionLineChartData,
    };
};
