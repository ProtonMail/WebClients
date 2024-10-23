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

            expect(result.current.balance).toBe(11884066);
        });
    });
});
