import { useMemo } from 'react';

import { format } from 'date-fns';
import { groupBy } from 'lodash';

import { Transaction } from '../types';

export const useBalanceEvolution = (currentBalance: any, lastTransactions: Transaction[]) => {
    /**
     * Balance evolution from oldest transaction to newest one
     */
    const evolutionByTx = useMemo(() => {
        if (!lastTransactions.length) {
            // CHart.js needs to elements in the array to draw the chart
            return new Array(2).fill({ balance: currentBalance, timestamp: new Date().getTime() });
        }

        // Sort tx from most recent to oldest
        const sorted = lastTransactions.sort(
            ({ timestamp: timestampA }, { timestamp: timestampB }) => timestampB - timestampA
        );

        const [mostRecentTx] = sorted;

        return sorted.reduce(
            (acc, transaction) => {
                const [lastAccTx] = acc;

                return [{ balance: lastAccTx.balance - transaction.value, timestamp: transaction.timestamp }, ...acc];
            },
            [{ balance: currentBalance, timestamp: mostRecentTx.timestamp }]
        );
    }, [currentBalance, lastTransactions]);

    /**
     * Balance evolution from oldest transaction day to newest one
     */
    const evolutionByDay = useMemo(() => {
        if (!lastTransactions.length) {
            // CHart.js needs to elements in the array to draw the chart
            return new Array(2).fill({ balance: currentBalance, day: format(new Date(), 'MM/dd/yyyy') });
        }

        const txGroupedByDay = groupBy(lastTransactions, (tx) => format(new Date(tx.timestamp), 'MM/dd/yyyy'));

        // Sort tx days from most recent day to oldest day
        const sortedDays = Object.keys(txGroupedByDay).sort(
            (dayA, dayB) => new Date(dayB).getTime() - new Date(dayA).getTime()
        );

        const [mostRecentDay] = sortedDays;
        return sortedDays.reduce(
            (acc, day) => {
                const dayTxs = txGroupedByDay[day];
                const [lastAccDay] = acc;

                const dayBalance = dayTxs.reduce((acc, tx) => acc + tx.value, 0);
                return [{ balance: lastAccDay.balance - dayBalance, day }, ...acc];
            },
            [{ balance: currentBalance, day: mostRecentDay }]
        );
    }, [currentBalance, lastTransactions]);

    const [oldestBalance] = evolutionByTx;

    const balanceDifference = evolutionByTx.length >= 1 ? currentBalance - oldestBalance.balance : 0;
    return { balanceDifference, evolutionByTx, evolutionByDay };
};
