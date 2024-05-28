import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { MockedFunction } from 'vitest';

import { WasmAccount, WasmBlockchainClient, WasmWallet } from '@proton/andromeda';
import { MINUTE } from '@proton/shared/lib/constants';
import { mockUseNotifications } from '@proton/testing/lib/vitest';

import { mockUseBlockchainClient } from '../../tests';
import { apiWalletsData } from '../../tests/fixtures/api';
import { mockUseBitcoinNetwork } from '../../tests/mocks/useBitcoinNetwork';
import { mockUseDebounceEffect } from '../../tests/mocks/useDebounceEffect';
import { useWalletsChainData } from './useWalletsChainData';

const accounts = {
    '0': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '8': {
                account: expect.any(WasmAccount),
                derivationPath: "m/84'/0'/0'",
                scriptType: 3,
            },
            '9': {
                account: expect.any(WasmAccount),
                derivationPath: "m/86'/0'/0'",
                scriptType: 4,
            },
        },
    },
    '1': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '10': {
                account: expect.any(WasmAccount),
                derivationPath: "m/49'/0'/0'",
                scriptType: 2,
            },
            '11': {
                account: expect.any(WasmAccount),
                derivationPath: "m/84'/0'/0'",
                scriptType: 3,
            },
        },
    },
    '2': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '12': {
                account: expect.any(WasmAccount),
                derivationPath: "m/84'/0'/0'",
                scriptType: 3,
            },
        },
    },
};

describe('useWalletsChainData', () => {
    let mockedFullSync: MockedFunction<WasmBlockchainClient['fullSync']>;

    beforeEach(() => {
        mockUseBitcoinNetwork();
        mockUseNotifications();

        mockedFullSync = vi.fn();
        mockUseBlockchainClient({ fullSync: mockedFullSync });
        mockUseDebounceEffect();

        vitest.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vitest.useRealTimers();
    });

    it('should sync accounts every 10 minutes, when needed', async () => {
        const { result } = renderHook(() => useWalletsChainData(apiWalletsData));

        // one for each account
        await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(5));
        expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 33);
        expect(result.current.walletsChainData).toStrictEqual(accounts);

        // After 10 minutes, it should run a new sync loop
        vi.clearAllMocks();
        vitest.advanceTimersByTime(10 * MINUTE);

        await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(5));
        expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 33);
        vi.clearAllMocks();
    });

    describe('manual triggers', () => {
        beforeEach(() => {
            // We remove the effect to avoid conflict with the loop in the mock
            mockUseDebounceEffect(true);
        });

        it('should return helpers to trigger manually sync for single account, when needed', async () => {
            const { result } = renderHook(() => useWalletsChainData(apiWalletsData));

            await result.current.syncSingleWalletAccount('0', '8');

            await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(1));
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 33);

            // Now it shouldn't run any sync anymore
            vi.clearAllMocks();

            await result.current.syncSingleWalletAccount('0', '8');

            expect(mockedFullSync).toHaveBeenCalledTimes(0);
        });

        it('should return helpers to trigger manually sync for single wallet, when needed', async () => {
            const { result } = renderHook(() => useWalletsChainData(apiWalletsData));

            await result.current.syncSingleWallet('0');

            await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(2));
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 33);

            // Now it shouldn't run any sync anymore
            vi.clearAllMocks();

            await result.current.syncSingleWallet('0');

            expect(mockedFullSync).toHaveBeenCalledTimes(0);
        });
    });

    describe('when hook gets unmounted', () => {
        it('should stop polling on hook unmount', async () => {
            const { unmount } = renderHook(() => useWalletsChainData(apiWalletsData));

            // one for each account
            await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(5));
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 33);

            // After 10 minutes, it should run a new sync loop
            vi.clearAllMocks();
            vitest.advanceTimersByTime(10 * MINUTE);

            await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(5));
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 33);

            vi.clearAllMocks();
            unmount();
            vitest.advanceTimersByTime(10 * MINUTE);
        });
    });

    describe('when network or wallets are not provided', () => {
        it('should not poll', async () => {
            renderHook(() => useWalletsChainData());

            expect(mockedFullSync).toHaveBeenCalledTimes(0);

            vitest.advanceTimersByTime(10 * MINUTE);
        });
    });
});
