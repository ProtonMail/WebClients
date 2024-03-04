import { renderHook } from '@testing-library/react-hooks';
import { vi } from 'vitest';

import * as getRandomAccentColorModule from '@proton/shared/lib/colors';

import { mockUseBitcoinBlockchainContext } from '../../tests';
import { apiWalletsData } from '../../tests/fixtures/api';
import { mockUseDecryptedWallets } from '../../tests/mocks/useDecryptedWallet';
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

        mockUseBitcoinBlockchainContext();
        mockUseDecryptedWallets();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('balance overview for multiple wallets', () => {
        it("should return the sum of all wallet's balance", () => {
            const { result } = renderHook(() => useBalanceOverview(apiWalletsData));

            expect(result.current.totalBalance).toBe(22881239);
        });

        it('should return the difference between 7-day-ago balance and current one', () => {
            const { result } = renderHook(() => useBalanceOverview(apiWalletsData));

            expect(result.current.last7DaysBalanceDifference).toStrictEqual(-2158170);
        });

        it('should return wallets balance distribution doughnut data', () => {
            const { result } = renderHook(() => useBalanceOverview(apiWalletsData));

            expect(result.current.balanceDistributionDoughnutChartData).toStrictEqual([
                [11884066, '#33FF33', 'Bitcoin 01'],
                [8384799, '#FF3333', 'Savings on Jade'],
                [2612374, '#5733FF', 'Savings on Electrum'],
            ]);
        });

        it('should return wallets balance evolution chart data', () => {
            const { result } = renderHook(() => useBalanceOverview(apiWalletsData));

            expect(result.current.balanceEvolutionLineChartData).toStrictEqual({
                data: [
                    { x: '11/21/2023', y: 25039409 },
                    { x: '11/22/2023', y: 24407480 },
                    { x: '11/23/2023', y: 22881239 },
                    { x: '11/24/2023', y: 22881239 },
                    { x: '11/25/2023', y: 22881239 },
                    { x: '11/26/2023', y: 22881239 },
                    { x: '11/27/2023', y: 22881239 },
                    { x: '11/27/2023', y: 22881239 },
                ],
            });
        });

        describe('when data is empty', () => {
            it('should return empty chart data', () => {
                const { result } = renderHook(() => useBalanceOverview([]));

                expect(result.current.totalBalance).toBe(0);
                expect(result.current.balanceDistributionDoughnutChartData).toStrictEqual([]);
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
        const [apiWallet] = apiWalletsData;

        it('should return the sum of all wallet accounts balances', () => {
            const { result } = renderHook(() => useBalanceOverview(apiWallet));

            expect(result.current.totalBalance).toBe(11884066);
        });

        it('should return the difference between 7-day-ago balance and current one', () => {
            const { result } = renderHook(() => useBalanceOverview(apiWallet));

            expect(result.current.last7DaysBalanceDifference).toStrictEqual(-619482);
        });

        it('should return wallets balance distribution doughnut data', () => {
            const { result } = renderHook(() => useBalanceOverview(apiWallet));

            expect(result.current.balanceDistributionDoughnutChartData).toStrictEqual([
                [100067, '#33FF33', 'Account 1'],
                [11783999, '#FF3333', 'Account 2'],
            ]);
        });

        it('should return wallets balance evolution chart data', () => {
            const { result } = renderHook(() => useBalanceOverview(apiWallet));

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
