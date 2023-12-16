import { renderHook } from '@testing-library/react-hooks';
import { vi } from 'vitest';

import * as getRandomAccentColorModule from '@proton/shared/lib/colors';

import { walletsWithAccountsWithBalanceAndTxs } from '../../tests';
import { useBalanceOverview } from './useBalanceOverview';

describe('useBalanceOverview', () => {
    const randomAccentColorMock = vi.spyOn(getRandomAccentColorModule, 'getRandomAccentColor');

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('11/27/2023'));

        randomAccentColorMock.mockReset();
        randomAccentColorMock
            .mockReturnValueOnce('#33FF33')
            .mockReturnValueOnce('#FF3333')
            .mockReturnValueOnce('#5733FF')
            .mockReturnValueOnce('#336EFF')
            .mockReturnValueOnce('#33FFAA')
            .mockReturnValueOnce('#B4A40E');
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('balance overview for multiple wallets', () => {
        it("should return the sum of all wallet's balance", () => {
            const { result } = renderHook(() => useBalanceOverview(walletsWithAccountsWithBalanceAndTxs));

            expect(result.current.totalBalance).toBe(31756581);
        });

        it('should return the difference between 7-day-ago balance and current one', () => {
            const { result } = renderHook(() => useBalanceOverview(walletsWithAccountsWithBalanceAndTxs));

            expect(result.current.last7DaysBalanceDifference).toStrictEqual(2140601);
        });

        it('should return wallets balance distribution doughnut data', () => {
            const { result } = renderHook(() => useBalanceOverview(walletsWithAccountsWithBalanceAndTxs));

            expect(result.current.balanceDistributionDoughnutChartData).toStrictEqual({
                datasets: [
                    {
                        backgroundColor: ['#33FF33', '#FF3333', '#5733FF', '#336EFF'],
                        borderWidth: 0,
                        cutout: '70%',
                        data: [11884066, 8384799, 2612374, 8875342],
                        label: 'Balance',
                    },
                ],
                labels: ['Bitcoin 01', 'Savings on Jade', 'Savings on Electrum', 'Lightning 01'],
            });
        });

        it('should return wallets balance evolution chart data', () => {
            const { result } = renderHook(() => useBalanceOverview(walletsWithAccountsWithBalanceAndTxs));

            expect(result.current.balanceEvolutionLineChartData).toStrictEqual({
                data: [
                    { x: '11/21/2023', y: 33914751 },
                    { x: '11/22/2023', y: 33282822 },
                    { x: '11/23/2023', y: 31756581 },
                    { x: '11/24/2023', y: 31756581 },
                    { x: '11/25/2023', y: 31756581 },
                    { x: '11/26/2023', y: 31756581 },
                    { x: '11/27/2023', y: 31756581 },
                    { x: '11/27/2023', y: 31756581 },
                ],
            });
        });

        describe('when data is empty', () => {
            it('should return empty chart data', () => {
                const { result } = renderHook(() => useBalanceOverview([]));

                expect(result.current.totalBalance).toBe(0);
                expect(result.current.balanceDistributionDoughnutChartData).toStrictEqual({
                    datasets: [
                        {
                            backgroundColor: [],
                            borderWidth: 0,
                            data: [],
                            label: 'Balance',
                        },
                    ],
                    labels: [],
                });
                expect(result.current.balanceEvolutionLineChartData).toStrictEqual({
                    data: [
                        { x: '11/27/2023', y: 0 },
                        { x: '11/27/2023', y: 0 },
                    ],
                });
            });
        });
    });

    describe('balance overview for a single wallet', () => {
        const [walletWithAccountsWithBalanceAndTxs] = walletsWithAccountsWithBalanceAndTxs;

        it('should return the sum of all wallet accounts balances', () => {
            const { result } = renderHook(() => useBalanceOverview(walletWithAccountsWithBalanceAndTxs));

            expect(result.current.totalBalance).toBe(11884066);
        });

        it('should return the difference between 7-day-ago balance and current one', () => {
            const { result } = renderHook(() => useBalanceOverview(walletWithAccountsWithBalanceAndTxs));

            expect(result.current.last7DaysBalanceDifference).toStrictEqual(2055857);
        });

        it('should return wallets balance distribution doughnut data', () => {
            const { result } = renderHook(() => useBalanceOverview(walletWithAccountsWithBalanceAndTxs));

            expect(result.current.balanceDistributionDoughnutChartData).toStrictEqual({
                datasets: [
                    {
                        backgroundColor: ['#33FF33', '#FF3333'],
                        borderWidth: 0,
                        cutout: '70%',
                        data: [100067, 11783999],
                        label: 'Balance',
                    },
                ],
                labels: ['Account 1', 'Account 2'],
            });
        });

        it('should return wallets balance evolution chart data', () => {
            const { result } = renderHook(() => useBalanceOverview(walletWithAccountsWithBalanceAndTxs));

            expect(result.current.balanceEvolutionLineChartData).toStrictEqual({
                data: [
                    { x: '11/21/2023', y: 12503548 },
                    { x: '11/22/2023', y: 12503548 },
                    { x: '11/23/2023', y: 11884066 },
                    { x: '11/24/2023', y: 11884066 },
                    { x: '11/25/2023', y: 11884066 },
                    { x: '11/26/2023', y: 11884066 },
                    { x: '11/27/2023', y: 11884066 },
                    { x: '11/27/2023', y: 11884066 },
                ],
            });
        });
    });
});
