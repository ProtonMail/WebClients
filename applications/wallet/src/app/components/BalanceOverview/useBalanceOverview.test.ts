import { renderHook } from '@testing-library/react-hooks';

import { transactions, wallets } from '../../tests';
import * as getRandomColorModule from '../../utils/color';
import { useBalanceOverview } from './useBalanceOverview';

describe('useBalanceOverview', () => {
    beforeEach(() => {
        jest.spyOn(getRandomColorModule, 'getRandomColor')
            .mockReturnValueOnce('#33FF33')
            .mockReturnValueOnce('#FF3333')
            .mockReturnValueOnce('#5733FF')
            .mockReturnValueOnce('#336EFF')
            .mockReturnValueOnce('#33FFAA');
    });

    it("should return the sum of all wallet's balance", () => {
        const { result } = renderHook(() => useBalanceOverview(wallets, transactions));

        expect(result.current.totalBalance).toBe(22881239);
    });

    it('should return the difference between 7-day-ago balance and current one', () => {
        const { result } = renderHook(() => useBalanceOverview(wallets, transactions));

        expect(result.current.last7DaysBalanceDifference).toStrictEqual(-7920511);
    });

    it('should return wallets balance distribution doughnut data', () => {
        const { result } = renderHook(() => useBalanceOverview(wallets, transactions));

        expect(result.current.balanceDistributionDoughnutChartData).toStrictEqual({
            datasets: [
                {
                    backgroundColor: ['#33FF33', '#FF3333', '#5733FF', '#336EFF', '#33FFAA'],
                    borderWidth: 0,
                    cutout: '70%',
                    data: [100067, 11783999, 97536, 8287263, 2612374],
                    label: 'Balance',
                },
            ],
            labels: ['lightning 01', 'Bitcoin 01', 'Bitcoin 02', 'Bitcoin 03', 'Lightning 02'],
        });
    });

    it('should return wallets balance evolution chart data', () => {
        const { result } = renderHook(() => useBalanceOverview(wallets, transactions));

        expect(result.current.balanceEvolutionLineChartData).toStrictEqual({
            data: [
                { x: '11/15/2023', y: 30801750 },
                { x: '11/16/2023', y: 31103964 },
                { x: '11/17/2023', y: 32054882 },
                { x: '11/18/2023', y: 22650726 },
                { x: '11/19/2023', y: 24084347 },
                { x: '11/21/2023', y: 25039409 },
                { x: '11/22/2023', y: 24407480 },
                { x: '11/22/2023', y: 22881239 },
            ],
        });
    });
});
