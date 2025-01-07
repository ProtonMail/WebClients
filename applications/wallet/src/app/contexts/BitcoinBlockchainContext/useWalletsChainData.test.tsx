import type { PropsWithChildren } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import type { MockedFunction } from 'vitest';

import type { WasmBlockchainClient } from '@proton/andromeda';
import { WasmAccount, WasmWallet } from '@proton/andromeda';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { MINUTE } from '@proton/shared/lib/constants';
import { mockUseNotifications } from '@proton/testing/lib/vitest';
import { setupStore } from '@proton/wallet/store';
import { apiWalletsData, mockUseFlag, mockUseGetBitcoinNetwork, mockUseWalletApiClients } from '@proton/wallet/tests';

import { mockUseBlockchainClient } from '../../tests';
import { mockIsFullSyncDone } from '../../tests/mocks/useCache';
import { mockUseDebounceEffect } from '../../tests/mocks/useDebounceEffect';
import { useWalletsChainData } from './useWalletsChainData';

const accounts = {
    '0': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '8': {
                account: expect.any(WasmAccount),
                derivationPath: "84'/0'/0'",
                key: 'wallet-sync-1',
                scriptType: 3,
                poolSize: 3,
                lastUsedIndex: 0,
            },
            '9': {
                account: expect.any(WasmAccount),
                derivationPath: "86'/0'/0'",
                key: 'wallet-sync-2',
                scriptType: 4,
                poolSize: 3,
                lastUsedIndex: 0,
            },
        },
    },
    '1': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '10': {
                account: expect.any(WasmAccount),
                derivationPath: "49'/0'/0'",
                key: 'wallet-sync-3',
                scriptType: 2,
                poolSize: 3,
                lastUsedIndex: 0,
            },
            '11': {
                account: expect.any(WasmAccount),
                derivationPath: "84'/0'/0'",
                key: 'wallet-sync-4',
                scriptType: 3,
                poolSize: 3,
                lastUsedIndex: 0,
            },
        },
    },
    '2': {
        wallet: expect.any(WasmWallet),
        accounts: {
            '12': {
                account: expect.any(WasmAccount),
                derivationPath: "84'/0'/0'",
                key: 'wallet-sync-5',
                scriptType: 3,
                poolSize: 3,
                lastUsedIndex: 0,
            },
        },
    },
};

describe('useWalletsChainData', () => {
    let mockedFullSync: MockedFunction<WasmBlockchainClient['fullSync']>;

    beforeEach(() => {
        mockUseGetBitcoinNetwork();
        mockUseNotifications();

        mockUseFlag(true);
        mockIsFullSyncDone(true);

        mockedFullSync = vi.fn();
        mockUseBlockchainClient({ fullSync: mockedFullSync, shouldSync: vi.fn().mockResolvedValue(true) });
        mockUseWalletApiClients();
        mockUseDebounceEffect();

        vitest.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vitest.useRealTimers();
    });

    it('should sync accounts every 10 minutes, when needed', async () => {
        const store = setupStore();

        function Wrapper({ children }: PropsWithChildren<{}>): React.JSX.Element {
            return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
        }

        const { result } = renderHook(() => useWalletsChainData(apiWalletsData), {
            wrapper: Wrapper,
        });

        // one for each account
        await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(5));
        expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 53);
        expect(result.current.walletsChainData).toStrictEqual(accounts);

        // After 10 minutes, it should run a new sync loop
        vi.clearAllMocks();
        vitest.advanceTimersByTime(10 * MINUTE);

        await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(5));
        expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 53);
        vi.clearAllMocks();
    });

    describe('manual triggers', () => {
        beforeEach(() => {
            // We remove the effect to avoid conflict with the loop in the mock
            mockUseDebounceEffect(true);
        });

        it('should return helpers to trigger manually sync for single account, when needed', async () => {
            const store = setupStore();

            function Wrapper({ children }: PropsWithChildren<{}>): React.JSX.Element {
                return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
            }

            const { result, waitForNextUpdate } = renderHook(() => useWalletsChainData(apiWalletsData), {
                wrapper: Wrapper,
            });
            await waitForNextUpdate();

            // we advance timer to bypass cooldown
            vitest.advanceTimersByTime(2 * MINUTE);
            mockedFullSync.mockClear();

            await result.current.syncSingleWalletAccount({ walletId: '0', accountId: '8' });

            await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(1));
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 53);

            // Now it shouldn't run any sync anymore
            vi.clearAllMocks();

            await result.current.syncSingleWalletAccount({ walletId: '0', accountId: '8' });

            expect(mockedFullSync).toHaveBeenCalledTimes(0);
        });

        it('should return helpers to trigger manually sync for single wallet, when needed', async () => {
            const store = setupStore();

            function Wrapper({ children }: PropsWithChildren<{}>): React.JSX.Element {
                return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
            }

            const { result, waitForNextUpdate } = renderHook(() => useWalletsChainData(apiWalletsData), {
                wrapper: Wrapper,
            });
            await waitForNextUpdate();
            // we advance timer to bypass cooldown
            vitest.advanceTimersByTime(2 * MINUTE);
            mockedFullSync.mockClear();

            await result.current.syncSingleWallet({ walletId: '0', manual: true });

            await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(2));
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 53);

            // Now it shouldn't run any sync anymore
            vi.clearAllMocks();

            await result.current.syncSingleWallet({ walletId: '0' });

            expect(mockedFullSync).toHaveBeenCalledTimes(0);
        });
    });

    describe('when hook gets unmounted', () => {
        it('should stop polling on hook unmount', async () => {
            const store = setupStore();

            function Wrapper({ children }: PropsWithChildren<{}>): React.JSX.Element {
                return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
            }

            const { unmount, waitForNextUpdate } = renderHook(() => useWalletsChainData(apiWalletsData), {
                wrapper: Wrapper,
            });

            // one for each account
            await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(5));
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 53);

            // After 10 minutes, it should run a new sync loop
            vi.clearAllMocks();
            vitest.advanceTimersByTime(10 * MINUTE);

            await waitForNextUpdate();
            await waitFor(() => expect(mockedFullSync).toHaveBeenCalledTimes(5));
            expect(mockedFullSync).toHaveBeenLastCalledWith(expect.any(WasmAccount), 53);

            vi.clearAllMocks();
            unmount();
            vitest.advanceTimersByTime(10 * MINUTE);

            expect(mockedFullSync).toHaveBeenCalledTimes(0);
        });
    });
});
