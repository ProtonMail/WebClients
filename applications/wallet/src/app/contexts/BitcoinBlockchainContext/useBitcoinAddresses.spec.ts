import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { type WasmApiWalletBitcoinAddress, WasmNetwork } from '@proton/andromeda';
import { setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import { type SimpleMap } from '@proton/shared/lib/interfaces';
import { mockUseGetAddressKeys } from '@proton/testing/lib/vitest';
import { type WalletWithChainData } from '@proton/wallet';
import {
    apiWalletsData,
    getAddressKey,
    mockUseGetBitcoinAddressPool,
    mockUseWalletApiClients,
} from '@proton/wallet/tests';

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
        mockUseWalletApiClients();

        const address = await getAddressKey();

        mockUseGetAddressKeys(async () => address.keys);
    });

    it('should generate correct address', async () => {
        const { result } = renderHook(() =>
            useBitcoinAddresses({ apiWalletsData, walletsChainData, isSyncing: vi.fn() })
        );

        await waitFor(() =>
            expect(
                result.current.bitcoinAddressHelperByWalletAccountId[apiWalletsData[0].WalletAccounts[0].ID]
            ).toBeTruthy()
        );

        const addressHelper =
            result.current.bitcoinAddressHelperByWalletAccountId[apiWalletsData[0].WalletAccounts[0].ID];

        // address at index 0
        expect(addressHelper?.receiveBitcoinAddress.address).toBe('tb1qdcmf2j6d8fvvlw0nyp76q2jrgvxd94e8nvt5sv');
    });

    it('should take LastUsedIndex into account', async () => {
        const { result } = renderHook(() =>
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
            })
        );

        await waitFor(() =>
            expect(
                result.current.bitcoinAddressHelperByWalletAccountId[apiWalletsData[0].WalletAccounts[0].ID]
            ).toBeTruthy()
        );

        const addressHelper =
            result.current.bitcoinAddressHelperByWalletAccountId[apiWalletsData[0].WalletAccounts[0].ID];

        expect(addressHelper?.receiveBitcoinAddress.address).toBe('tb1qdcmf2j6d8fvvlw0nyp76q2jrgvxd94e8nvt5sv');
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
            const { result } = renderHook(() =>
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
                })
            );

            await waitFor(() =>
                expect(
                    result.current.bitcoinAddressHelperByWalletAccountId[apiWalletsData[0].WalletAccounts[0].ID]
                ).toBeTruthy()
            );

            expect(mockAddBitcoinAddresses).toHaveBeenCalledTimes(1);
            const addressPayload = mockAddBitcoinAddresses.mock.lastCall[2][0];
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
                'tb1qdcmf2j6d8fvvlw0nyp76q2jrgvxd94e8nvt5sv'
            );

            await getAddressHelper()?.generateNewReceiveAddress();

            // address at index 4
            expect(getAddressHelper()?.receiveBitcoinAddress.address).toBe(
                'tb1qt7s43xt3jedpp4hlc48g8xczpeav78ap670240'
            );
        });
    });
});
