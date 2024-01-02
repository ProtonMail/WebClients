import { useMemo } from 'react';

import { format, sub } from 'date-fns';
import { groupBy } from 'lodash';

import { IWasmSimpleTransactionArray } from '../../pkg';
import { sortTransactionsByTime, transactionTime } from '../utils';

export const useBalanceEvolution = (currentBalance: number, lastTransactions: IWasmSimpleTransactionArray) => {
    /**
     * Balance evolution from oldest transaction to newest one
     */
    const evolutionByTx = useMemo(() => {
        if (!lastTransactions.length) {
            // CHart.js needs to elements in the array to draw the chart
            return new Array(2).fill({ balance: currentBalance, timestamp: new Date().getTime() });
        }

        // Sort tx from most recent to oldest
        const sorted = sortTransactionsByTime(lastTransactions);

        const [mostRecentTx] = sorted;

        const evolByTx: { balance: number; timestamp: number }[] = sorted.reduce(
            (acc, transaction) => {
                const [lastAccTx] = acc;

                return [
                    {
                        balance: lastAccTx.balance - Number(transaction.value),
                        timestamp: transactionTime(transaction),
                    },
                    ...acc,
                ];
            },
            [
                {
                    balance: currentBalance,
                    timestamp: transactionTime(mostRecentTx),
                },
            ]
        );

        return evolByTx;
    }, [currentBalance, lastTransactions]);

    /**
     * Balance evolution from oldest transaction day to newest one
     */
    const evolutionByDay = useMemo(() => {
        if (!lastTransactions.length) {
            // CHart.js needs to elements in the array to draw the chart
            return new Array(2).fill({ balance: currentBalance, day: format(new Date(), 'MM/dd/yyyy') });
        }

        const today = new Date();
        const lastSevenDays = new Array(7).fill(null).map((_, index) => {
            const day = sub(today, { days: index });
            return format(day, 'MM/dd/yyyy');
        });

        const txGroupedByDay = groupBy(lastTransactions, (tx) => {
            const date = new Date(transactionTime(tx));
            return format(date, 'MM/dd/yyyy');
        });

        const [mostRecentDay] = lastSevenDays;
        const newAcc = lastSevenDays.reduce(
            (acc, day) => {
                const txs = txGroupedByDay[day];
                const [lastAccDay] = acc;

                const dayBalance = txs?.reduce((acc, tx) => acc + Number(tx.value), 0) ?? 0;
                return [{ balance: lastAccDay.balance - dayBalance, day }, ...acc];
            },
            [{ balance: currentBalance, day: mostRecentDay }]
        );

        return newAcc;
    }, [currentBalance, lastTransactions]);

    const [firstDayBalance] = evolutionByDay;
    const lastDayBalance = evolutionByDay[evolutionByDay.length - 1];

    const balanceDifference = evolutionByTx.length >= 1 ? lastDayBalance.balance - firstDayBalance.balance : 0;

    return { balanceDifference, evolutionByTx, evolutionByDay };
};
