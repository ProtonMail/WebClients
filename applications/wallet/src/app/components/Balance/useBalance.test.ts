import { renderHook } from '@testing-library/react-hooks';
import { vi } from 'vitest';

import * as getRandomAccentColorModule from '@proton/shared/lib/colors';
import { apiWalletsData } from '@proton/wallet/tests';

import { mockUseBitcoinBlockchainContext } from '../../tests';
import { useBalance } from './useBalance';

describe('useBalance', () => {
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
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('balance overview for a single wallet', () => {
        const [apiWallet] = apiWalletsData;

        it('should return the sum of all wallet accounts balances', async () => {
            const { result, waitForNextUpdate } = renderHook(() => useBalance(apiWallet));
            await waitForNextUpdate();

            expect(result.current.totalBalance).toBe(11884066);
        });

        it('should return the difference between first and last day of evolution chart', async () => {
            const { result, waitForNextUpdate } = renderHook(() => useBalance(apiWallet));
            await waitForNextUpdate();

            expect(result.current.balanceDifference).toStrictEqual(-1198079);
        });

        it('should return wallets balance evolution chart data', async () => {
            const { result, waitForNextUpdate } = renderHook(() => useBalance(apiWallet));
            await waitForNextUpdate();

            expect(result.current.balanceEvolutionLineChartData).toStrictEqual({
                data: [
                    { x: '10/29/2023', y: 13082145 },
                    { x: '10/30/2023', y: 13082145 },
                    { x: '10/31/2023', y: 13082145 },
                    { x: '11/01/2023', y: 13082145 },
                    { x: '11/02/2023', y: 13082145 },
                    { x: '11/03/2023', y: 13082145 },
                    { x: '11/04/2023', y: 13082145 },
                    { x: '11/05/2023', y: 13082145 },
                    { x: '11/06/2023', y: 13082145 },
                    { x: '11/07/2023', y: 13082145 },
                    { x: '11/08/2023', y: 13082145 },
                    { x: '11/09/2023', y: 13082145 },
                    { x: '11/10/2023', y: 13082145 },
                    { x: '11/11/2023', y: 13082145 },
                    { x: '11/12/2023', y: 13082145 },
                    { x: '11/13/2023', y: 13082145 },
                    { x: '11/14/2023', y: 13082145 },
                    { x: '11/15/2023', y: 13082145 },
                    { x: '11/16/2023', y: 13082145 },
                    { x: '11/17/2023', y: 13082145 },
                    { x: '11/18/2023', y: 13082145 },
                    { x: '11/19/2023', y: 13082145 },
                    { x: '11/20/2023', y: 14042236 },
                    { x: '11/21/2023', y: 14042236 },
                    { x: '11/22/2023', y: 13410307 },
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
