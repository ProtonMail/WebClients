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

const firstIterAccounts = {
    '0': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '8': {
                account: expect.any(WasmAccount),
                derivationPath: "m/84'/0'/0'",
                scriptType: 2,
                syncId: 'account-sync-1',
            },
            '9': {
                account: expect.any(WasmAccount),
                derivationPath: "m/86'/0'/0'",
                scriptType: 3,
                syncId: 'account-sync-2',
            },
        },
    },
    '1': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '10': {
                account: expect.any(WasmAccount),
                derivationPath: "m/49'/0'/0'",
                scriptType: 1,
                syncId: 'account-sync-3',
            },
            '11': {
                account: expect.any(WasmAccount),
                derivationPath: "m/84'/0'/0'",
                scriptType: 2,
                syncId: 'account-sync-4',
            },
        },
    },
    '2': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '12': {
                account: expect.any(WasmAccount),
                derivationPath: "m/84'/0'/0'",
                scriptType: 2,
                syncId: 'account-sync-5',
            },
        },
    },
};

const secondIterAccounts = {
    '0': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '8': {
                account: expect.any(WasmAccount),
                derivationPath: "m/84'/0'/0'",
                scriptType: 2,
                syncId: 'account-sync-6',
            },
            '9': {
                account: expect.any(WasmAccount),
                derivationPath: "m/86'/0'/0'",
                scriptType: 3,
                syncId: 'account-sync-7',
            },
        },
    },
    '1': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '10': {
                account: expect.any(WasmAccount),
                derivationPath: "m/49'/0'/0'",
                scriptType: 1,
                syncId: 'account-sync-8',
            },
            '11': {
                account: expect.any(WasmAccount),
                derivationPath: "m/84'/0'/0'",
                scriptType: 2,
                syncId: 'account-sync-9',
            },
        },
    },
    '2': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '12': {
                account: expect.any(WasmAccount),
                derivationPath: "m/84'/0'/0'",
                scriptType: 2,
                syncId: 'account-sync-10',
            },
        },
    },
};

describe('useWalletsChainData', () => {
    let mockedShouldSync: MockedFunction<WasmBlockchainClient['shouldSync']>;
    let mockedFullSync: MockedFunction<WasmBlockchainClient['fullSync']>;

    beforeEach(() => {
        mockUseBitcoinNetwork();
        mockUseNotifications();

        mockedShouldSync = vi.fn().mockResolvedValue(true);
        mockedFullSync = vi.fn();
        mockUseBlockchainClient({ shouldSync: mockedShouldSync, fullSync: mockedFullSync });
        mockUseDebounceEffect();

        vitest.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vitest.useRealTimers();
    });

    it('should sync accounts every 10 minutes, when needed', async () => {
        const { result } = renderHook(() => useWalletsChainData(apiWalletsData));

        // one for each account
        await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(5));
        expect(mockedShouldSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));
        expect(mockedFullSync).toHaveBeenCalledTimes(5);
        expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));
        expect(result.current.walletsChainData).toStrictEqual(firstIterAccounts);

        // After 10 minutes, it should run a new sync loop
        vi.clearAllMocks();
        vitest.advanceTimersByTime(10 * MINUTE);

        await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(5));
        expect(mockedShouldSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));
        expect(mockedFullSync).toHaveBeenCalledTimes(5);
        expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));
        expect(result.current.walletsChainData).toStrictEqual(secondIterAccounts);
        vi.clearAllMocks();

        // Now it shouldn't run any sync anymore, and shouldn't update syncId neither
        mockedShouldSync.mockResolvedValue(false);
        vitest.advanceTimersByTime(10 * MINUTE);

        await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(5));
        expect(mockedShouldSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));
        expect(mockedFullSync).toHaveBeenCalledTimes(0);
        expect(result.current.walletsChainData).toStrictEqual(secondIterAccounts);
    });

    describe('manual triggers', () => {
        beforeEach(() => {
            // We remove the effect to avoid conflict with the loop in the mock
            mockUseDebounceEffect(true);
        });

        it('should return helpers to trigger manually sync for single account, when needed', async () => {
            const { result } = renderHook(() => useWalletsChainData(apiWalletsData));

            await result.current.syncSingleWalletAccount('0', '8');

            await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(1));
            expect(mockedShouldSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));
            expect(mockedFullSync).toHaveBeenCalledTimes(1);
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));

            expect(result.current.walletsChainData['0']?.accounts['8']?.syncId).toBe('account-sync-11');

            // Now it shouldn't run any sync anymore, and shouldn't update syncId neither
            mockedShouldSync.mockResolvedValue(false);
            vi.clearAllMocks();

            await result.current.syncSingleWalletAccount('0', '8');

            await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(1));
            expect(mockedFullSync).toHaveBeenCalledTimes(0);

            expect(result.current.walletsChainData['0']?.accounts['8']?.syncId).toBe('account-sync-11');
        });

        it('should return helpers to trigger manually sync for single wallet, when needed', async () => {
            const { result } = renderHook(() => useWalletsChainData(apiWalletsData));

            await result.current.syncSingleWallet('0');

            await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(2));
            expect(mockedShouldSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));
            expect(mockedFullSync).toHaveBeenCalledTimes(2);
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));

            expect(result.current.walletsChainData['0']?.accounts['8']?.syncId).toBe('account-sync-12');
            expect(result.current.walletsChainData['0']?.accounts['9']?.syncId).toBe('account-sync-13');

            // Now it shouldn't run any sync anymore, and shouldn't update syncId neither
            mockedShouldSync.mockResolvedValue(false);
            vi.clearAllMocks();

            await result.current.syncSingleWallet('0');

            await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(2));
            expect(mockedFullSync).toHaveBeenCalledTimes(0);

            expect(result.current.walletsChainData['0']?.accounts['8']?.syncId).toBe('account-sync-12');
            expect(result.current.walletsChainData['0']?.accounts['9']?.syncId).toBe('account-sync-13');
        });
    });

    describe('when hook gets unmounted', () => {
        it('should stop polling on hook unmount', async () => {
            const { unmount } = renderHook(() => useWalletsChainData(apiWalletsData));

            // one for each account
            await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(5));
            expect(mockedShouldSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));
            expect(mockedFullSync).toHaveBeenCalledTimes(5);
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));

            // After 10 minutes, it should run a new sync loop
            vi.clearAllMocks();
            vitest.advanceTimersByTime(10 * MINUTE);

            await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(5));
            expect(mockedShouldSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));
            expect(mockedFullSync).toHaveBeenCalledTimes(5);
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount));

            vi.clearAllMocks();
            unmount();
            vitest.advanceTimersByTime(10 * MINUTE);

            await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(0));
        });
    });

    describe('when network or wallets are not provided', () => {
        it('should not poll', async () => {
            renderHook(() => useWalletsChainData());

            await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(0));

            vitest.advanceTimersByTime(10 * MINUTE);

            await waitFor(() => expect(mockedShouldSync).toHaveBeenCalledTimes(0));
        });
    });
});
