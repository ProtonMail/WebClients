import type { PropsWithChildren } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { type WasmApiWalletBitcoinAddress, WasmNetwork } from '@proton/andromeda';
import { setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { ProtonStoreProvider } from '@proton/redux-shared-store';
import { type SimpleMap } from '@proton/shared/lib/interfaces';
import { mockUseGetAddressKeys } from '@proton/testing/lib/vitest';
import { type WalletWithChainData } from '@proton/wallet';
import { extendStore, setupStore } from '@proton/wallet/store';
import {
    apiWalletsData,
    getAddressKey,
    getMockedApi,
    mockUseBitcoinAddressUsedIndexes,
    mockUseGetBitcoinAddressPool,
    mockUseWalletApiClients,
} from '@proton/wallet/tests';

import { mockUseBlockchainClient } from '../../tests';
import { useBitcoinAddresses } from './useBitcoinAddresses';
import { formatToSubset, getWalletsChainDataInit } from './useWalletsChainData';

const bitcoinAddresses: WasmApiWalletBitcoinAddress[] = [
    {
        ID: '999',
        WalletID: '',
        WalletAccountID: '',
        Fetched: 0,
        Used: 0,
        BitcoinAddress: '',
        BitcoinAddressSignature: '',
        BitcoinAddressIndex: 1,
    },
    {
        ID: '998',
        WalletID: '',
        WalletAccountID: '',
        Fetched: 0,
        Used: 0,
        BitcoinAddress: '',
        BitcoinAddressSignature: '',
        BitcoinAddressIndex: 2,
    },
    {
        ID: '997',
        WalletID: '',
        WalletAccountID: '',
        Fetched: 0,
        Used: 0,
        BitcoinAddress: '',
        BitcoinAddressSignature: '',
        BitcoinAddressIndex: 3,
    },
];

describe('useBitcoinAddresses', () => {
    let walletsChainData: SimpleMap<WalletWithChainData>;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    beforeEach(async () => {
        walletsChainData = await getWalletsChainDataInit({
            apiWalletsData: formatToSubset(apiWalletsData) ?? [],
            network: WasmNetwork.Testnet,
        });

        mockUseGetBitcoinAddressPool(vi.fn().mockResolvedValue(bitcoinAddresses));
        mockUseBitcoinAddressUsedIndexes(vi.fn().mockResolvedValue([]));
        mockUseBlockchainClient();
        mockUseWalletApiClients();

        const address = await getAddressKey();

        mockUseGetAddressKeys(async () => address.keys);

        extendStore({
            walletApi: getMockedApi({}),
        });
    });

    it('should generate correct address', async () => {
        const store = setupStore();

        function Wrapper({ children }: PropsWithChildren<{}>): React.JSX.Element {
            return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
        }

        const { result } = renderHook(
            () =>
                useBitcoinAddresses({
                    apiWalletsData,
                    walletsChainData,
                    isSyncing: vi.fn(),
                    network: WasmNetwork.Testnet,
                }),
            {
                wrapper: Wrapper,
            }
        );

        await waitFor(
            () =>
                expect(
                    result.current.bitcoinAddressHelperByWalletAccountId[apiWalletsData[0].WalletAccounts[0].ID]
                ).toBeTruthy(),
            { timeout: 3000 }
        );

        const addressHelper =
            result.current.bitcoinAddressHelperByWalletAccountId[apiWalletsData[0].WalletAccounts[0].ID];

        // address at index 0
        expect(addressHelper?.receiveBitcoinAddress.address).toBe('tb1q8lakdutt2atnthue4j8fngj7kdqdfh6jh23kd2');
        expect(addressHelper?.receiveBitcoinAddress.index).toBe(0);
    });

    it('should take LastUsedIndex into account', async () => {
        const store = setupStore();

        function Wrapper({ children }: PropsWithChildren<{}>): React.JSX.Element {
            return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
        }

        const { result } = renderHook(
            () =>
                useBitcoinAddresses({
                    apiWalletsData: [
                        {
                            ...apiWalletsData[0],
                            WalletAccounts: [
                                { ...apiWalletsData[0].WalletAccounts[0], LastUsedIndex: 4 },
                                ...apiWalletsData[0].WalletAccounts.slice(1),
                            ],
                        },
                        ...apiWalletsData.slice(1),
                    ],
                    walletsChainData,
                    isSyncing: vi.fn(),
                    network: WasmNetwork.Testnet,
                }),
            {
                wrapper: Wrapper,
            }
        );

        await waitFor(
            () =>
                expect(
                    result.current.bitcoinAddressHelperByWalletAccountId[apiWalletsData[0].WalletAccounts[0].ID]
                ).toBeTruthy(),
            { timeout: 3000 }
        );

        const addressHelper =
            result.current.bitcoinAddressHelperByWalletAccountId[apiWalletsData[0].WalletAccounts[0].ID];

        expect(addressHelper?.receiveBitcoinAddress.address).toBe('tb1qdcmf2j6d8fvvlw0nyp76q2jrgvxd94e8nvt5sv');
        expect(addressHelper?.receiveBitcoinAddress.index).toBe(4);
    });

    describe('when pool is empty', () => {
        const mockAddBitcoinAddresses = vi.fn();

        beforeEach(() => {
            mockUseGetBitcoinAddressPool(vi.fn().mockResolvedValue([]));
            mockUseWalletApiClients({
                bitcoin_address: {
                    addBitcoinAddresses: mockAddBitcoinAddresses,
                    getBitcoinAddresses: vi.fn().mockResolvedValue([]),
                },
            });
        });

        it('should generate correct addresses', async () => {
            const store = setupStore();

            function Wrapper({ children }: PropsWithChildren<{}>): React.JSX.Element {
                return <ProtonStoreProvider store={store}>{children}</ProtonStoreProvider>;
            }

            const { result } = renderHook(
                () =>
                    useBitcoinAddresses({
                        apiWalletsData: [
                            {
                                ...apiWalletsData[0],
                                WalletAccounts: [
                                    {
                                        ...apiWalletsData[0].WalletAccounts[0],
                                        Addresses: [{ ID: 'idid', Email: 'test@email.com' }],
                                    },
                                ],
                            },
                        ],
                        walletsChainData,
                        isSyncing: vi.fn(),
                        network: WasmNetwork.Testnet,
                    }),
                {
                    wrapper: Wrapper,
                }
            );

            await waitFor(
                () =>
                    expect(
                        result.current.bitcoinAddressHelperByWalletAccountId[apiWalletsData[0].WalletAccounts[0].ID]
                    ).toBeTruthy(),
                { timeout: 3000 }
            );

            expect(mockAddBitcoinAddresses).toHaveBeenCalledTimes(1);
            const addressPayload = mockAddBitcoinAddresses.mock.lastCall?.[2]?.[0];
            expect(addressPayload).toBeDefined();
            expect(addressPayload).toHaveLength(3);

            expect(addressPayload[0].Data.BitcoinAddressIndex).toBe(1);
            expect(addressPayload[0].Data.BitcoinAddress).toBe('tb1qm3qzhvwfj3lycdxjyrd9ll8u5v0m8yd20xfmld');

            expect(addressPayload[1].Data.BitcoinAddressIndex).toBe(2);
            expect(addressPayload[1].Data.BitcoinAddress).toBe('tb1q28cw58duzas8k522xpjqqj5xcmpfazr0rd0p89');

            expect(addressPayload[2].Data.BitcoinAddressIndex).toBe(3);
            expect(addressPayload[2].Data.BitcoinAddress).toBe('tb1qcy6d55jm69lyl56ayl3f5gkdl3a67uftamdpft');

            const getAddressHelper = () =>
                result.current.bitcoinAddressHelperByWalletAccountId[apiWalletsData[0].WalletAccounts[0].ID];

            // address at index 0
            expect(getAddressHelper()?.receiveBitcoinAddress.address).toBe(
                'tb1q8lakdutt2atnthue4j8fngj7kdqdfh6jh23kd2'
            );
            expect(getAddressHelper()?.receiveBitcoinAddress.index).toBe(0);

            await getAddressHelper()?.generateNewReceiveAddress();

            // address at index 4
            expect(getAddressHelper()?.receiveBitcoinAddress.address).toBe(
                'tb1qdcmf2j6d8fvvlw0nyp76q2jrgvxd94e8nvt5sv'
            );
            expect(getAddressHelper()?.receiveBitcoinAddress.index).toBe(4);
        });
    });
});
