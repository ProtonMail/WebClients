import { renderHook } from '@testing-library/react-hooks';
import { format, set } from 'date-fns';

import { BITCOIN } from '../constants';
import { useBalanceEvolution } from './useBalanceEvolution';

describe('useBalanceEvolution', () => {
    const baseDate = set(new Date(), { year: 2023, month: 10 });
    const simpleTransactions = [
        {
            timestamp: set(baseDate, { date: 22, hours: 13 }).getTime(),
            value: -0.24 * BITCOIN,
        },
        {
            timestamp: set(baseDate, { date: 22, hours: 6 }).getTime(),
            value: 0.04 * BITCOIN,
        },
        {
            timestamp: set(baseDate, { date: 21, hours: 7 }).getTime(),
            value: 0.8 * BITCOIN,
        },
        {
            timestamp: set(baseDate, { date: 21, hours: 8 }).getTime(),
            value: -0.05 * BITCOIN,
        },
        {
            timestamp: set(baseDate, { date: 21, hours: 9 }).getTime(),
            value: -0.05 * BITCOIN,
        },
    ];

    describe('evolutionByTx', () => {
        // TODO when/if used
    });

    describe('evolutionByDay', () => {
        /**
         * Given a current balance and transactions, the hook is able to retrieve balance prior to those transactions,
         * returning an array representing the evolution of the balance accross days.
         *
         * The balance of each element is computed via doing day+1.balance - ∑day.transactions.value
         *
         * Example:
         * - Current balance (22/11) = 1BTC
         * - Sum of transacted value on 22/11: -0.2BTC => Balance on the 21/11 = 1-(-0.2)=1.2
         * - Sum of transacted value on 21/11: 0.7BTC => Balance on the 20/11 = 1.2-(0.7)=0.5
         * The resulting evolution array will be: [21/11 -> 0.5, 22/11 -> 1.2, 22/11 -> 1]
         *
         * Last day is always repeated twice: once for day when transactions were done (i=1) and the last evolution element representing current balance (i=2)
         */
        it('should return a sorted array', () => {
            const { result } = renderHook(() => useBalanceEvolution(1 * BITCOIN, simpleTransactions));

            expect(result.current.evolutionByDay).toStrictEqual([
                {
                    balance: 0.5 * BITCOIN,
                    day: '11/21/2023',
                },
                {
                    balance: 1.2 * BITCOIN,
                    day: '11/22/2023',
                },
                {
                    balance: 1 * BITCOIN,
                    day: '11/22/2023',
                },
            ]);
        });

        describe('when transactions is empty', () => {
            it('should return 2 elements with value set to current balance and day set to current one', () => {
                const { result } = renderHook(() => useBalanceEvolution(1 * BITCOIN, []));

                expect(result.current.evolutionByDay).toStrictEqual([
                    { balance: 100000000, day: format(new Date(), 'MM/dd/yyyy') },
                    { balance: 100000000, day: format(new Date(), 'MM/dd/yyyy') },
                ]);
            });
        });
    });

    describe('balanceDifference', () => {
        /**
         * Using the evolutionByTx array, we take first element (oldest balance) and last one (newest balance) and compute the difference
         */
        it('should return difference between start and end balance', () => {
            const { result } = renderHook(() => useBalanceEvolution(1 * BITCOIN, simpleTransactions));
            expect(result.current.balanceDifference).toBe(0.5 * BITCOIN);
        });
    });
});
