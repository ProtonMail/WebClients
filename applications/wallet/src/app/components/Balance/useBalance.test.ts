import { renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import * as getRandomAccentColorModule from '@proton/shared/lib/colors';
import { apiWalletsData } from '@proton/wallet/tests/fixtures/api';

import { mockUseBitcoinBlockchainContext } from '../../tests';
import { useBalance } from './useBalance';

describe('useBalance', () => {
    const randomAccentColorMock = vi.spyOn(getRandomAccentColorModule, 'getRandomAccentColor');

    beforeEach(() => {
        // Only fake Date: faked timers would stall waitFor's polling
        vi.useFakeTimers({ toFake: ['Date'] });
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
            const { result } = renderHook(() => useBalance(apiWallet));

            await waitFor(() => expect(result.current.balance).toBe(11884066));
        });
    });
});
