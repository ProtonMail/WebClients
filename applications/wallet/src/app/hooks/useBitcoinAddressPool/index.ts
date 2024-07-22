import { useCallback, useEffect, useState } from 'react';

import { compact, uniq } from 'lodash';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import { useGetAddressKeys } from '@proton/components/hooks/useAddressesKeys';
import useEventManager from '@proton/components/hooks/useEventManager';
import type { IWasmApiWalletData } from '@proton/wallet';
import {
    POOL_FILLING_THRESHOLD,
    generateBitcoinAddressesPayloadForPoolFilling,
    signData,
    useWalletApiClients,
    verifySignedData,
} from '@proton/wallet';

import type { WalletWithChainData } from '../../types';
import { useComputeNextAddressToReceive } from '../../utils/hooks/useComputeNextIndexToReceive';

export const useBitcoinAddressPool = ({
    decryptedApiWalletsData,
    walletsChainData,
}: {
    decryptedApiWalletsData?: IWasmApiWalletData[];
    walletsChainData: Partial<Record<string, WalletWithChainData>>;
}) => {
    const api = useWalletApiClients();

    const getAddressKeys = useGetAddressKeys();
    const computeNextIndexToReceive = useComputeNextAddressToReceive(walletsChainData);
    const [isLoading, setIsLoading] = useState(false);

    const { subscribe } = useEventManager();

    const fillBitcoinAddressPoolForAccount = useCallback(
        async (walletAccount: WasmApiWalletAccount, walletWithChainData: WalletWithChainData) => {
            const walletId = walletAccount.WalletID;
            const walletAccountId = walletAccount.ID;
            const wasmAccount = walletWithChainData.accounts[walletAccountId];

            if (!wasmAccount || !walletAccount.Addresses.length) {
                return;
            }

            // We only support a single address per wallet account
            const [walletAccountAddress] = walletAccount.Addresses;

            const [primaryAddressKey] = await getAddressKeys(walletAccountAddress.ID);

            let nextIndexToUse = await computeNextIndexToReceive(walletAccount);

            const unusedBitcoinAddresses = await api.bitcoin_address
                .getBitcoinAddresses(walletId, walletAccountId)
                .then((data) => data[0]);

            const availableBitcoinAddresses = unusedBitcoinAddresses.filter((a) => !a.Data.Fetched);

            const computeAddressDataFromIndex = async (index: number) => {
                const { address } = await wasmAccount.account.getAddress(index);
                const signature = await signData(address, 'wallet.bitcoin-address', [primaryAddressKey.privateKey]);

                return {
                    BitcoinAddressIndex: index,
                    BitcoinAddress: address,
                    BitcoinAddressSignature: signature,
                };
            };

            // Create missing addresses
            const addressesToCreate = Math.max(0, POOL_FILLING_THRESHOLD - availableBitcoinAddresses.length);

            // Fill bitcoin address pool
            const addressesPoolPayload = await generateBitcoinAddressesPayloadForPoolFilling({
                addressesToCreate,
                startIndex: nextIndexToUse,
                wasmAccount: wasmAccount.account,
                addressKey: primaryAddressKey,
            });

            if (addressesPoolPayload) {
                try {
                    await api.bitcoin_address.addBitcoinAddress(walletId, walletAccountId, addressesPoolPayload);
                } catch (e) {
                    console.error('Could not add new bitcoin addresses', e);
                }
            }

            // Update addresses without bitcoin address or with outdated ones
            const addressesWithOutdatedSignature = await Promise.all(
                unusedBitcoinAddresses.map(async (addr) => {
                    if (!addr.Data.BitcoinAddressSignature || !addr.Data.BitcoinAddress) {
                        return addr;
                    }

                    const isVerified = await verifySignedData(
                        addr.Data.BitcoinAddress,
                        addr.Data.BitcoinAddressSignature,
                        'wallet.bitcoin-address',
                        [primaryAddressKey.privateKey]
                    );

                    return isVerified ? undefined : addr;
                })
            );

            for (const addressToUpdate of compact(addressesWithOutdatedSignature)) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-loop-func
                    const addressData = await (async () => {
                        if (addressToUpdate?.Data.BitcoinAddressIndex) {
                            return computeAddressDataFromIndex(addressToUpdate.Data.BitcoinAddressIndex);
                        } else {
                            const addressData = await computeAddressDataFromIndex(nextIndexToUse);
                            nextIndexToUse++;
                            return addressData;
                        }
                    })();

                    await api.bitcoin_address.updateBitcoinAddress(
                        walletId,
                        walletAccountId,
                        addressToUpdate.Data.ID,
                        addressData
                    );
                } catch (e) {
                    console.error('Could not update bitcoin address', e);
                }
            }
        },
        [computeNextIndexToReceive, getAddressKeys]
    );

    const fillBitcoinAddressPools = useCallback(
        async (data?: { walletAccountIds?: string[] }) => {
            setIsLoading(true);

            for (const decryptedWallet of decryptedApiWalletsData ?? []) {
                const walletId = decryptedWallet.Wallet.ID;
                const wallet = walletsChainData[walletId];

                // We cannot create address with the wasm wallet
                if (!wallet) {
                    console.warn('Cannot fill bitcoin address pool: wallet is missing');
                    continue;
                }

                const filterWalletAccounts = data?.walletAccountIds
                    ? decryptedWallet.WalletAccounts.filter((a) => data?.walletAccountIds?.includes(a.ID))
                    : decryptedWallet.WalletAccounts;

                for (const walletAccount of filterWalletAccounts) {
                    await fillBitcoinAddressPoolForAccount(walletAccount, wallet);
                }
            }
            setIsLoading(false);
        },
        [decryptedApiWalletsData, fillBitcoinAddressPoolForAccount, walletsChainData]
    );

    useEffect(() => {
        return subscribe(
            async ({
                WalletBitcoinAddresses = [],
            }: {
                WalletBitcoinAddresses: {
                    WalletBitcoinAddress: {
                        WalletAccountID: string;
                        BitcoinAddress?: string;
                        Fetched: boolean;
                        Used: boolean;
                    };
                }[];
            }) => {
                const walletAccountIds = uniq(
                    /**
                     * We want to keep only address events for
                     * - Address request creation (!b.BitcoinAddress)
                     * - Address lookup (b.Fetched)
                     * - Address use (b.Used)
                     *
                     * And fill the pool for every wallet account related
                     */
                    WalletBitcoinAddresses.filter(
                        ({ WalletBitcoinAddress: b }) => !b.BitcoinAddress || b.Fetched || b.Used
                    ).map(({ WalletBitcoinAddress: b }) => b.WalletAccountID)
                );

                await fillBitcoinAddressPools({ walletAccountIds });
            }
        );
    }, [fillBitcoinAddressPools, subscribe]);

    return { isLoading, fillBitcoinAddressPools, fillBitcoinAddressPoolForAccount };
};
