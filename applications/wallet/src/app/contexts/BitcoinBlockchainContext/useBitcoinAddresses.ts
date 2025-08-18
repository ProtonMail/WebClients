import { useCallback, useEffect, useMemo, useState } from 'react';

import compact from 'lodash/compact';
import uniq from 'lodash/uniq';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import {
    type WasmAccount,
    type WasmAddressInfo,
    type WasmApiWallet,
    type WasmApiWalletAccount,
    type WasmApiWalletBitcoinAddress,
    WasmKeychainKind,
    type WasmNetwork,
} from '@proton/andromeda';
import useEventManager from '@proton/components/hooks/useEventManager';
import { SECOND } from '@proton/shared/lib/constants';
import { type DecryptedAddressKey, type SimpleMap } from '@proton/shared/lib/interfaces';
import {
    type AccountWithChainData,
    type ApiWalletWithPassphraseInput,
    type IWasmApiWalletData,
    type WalletWithChainData,
    computeAddress,
    generateBitcoinAddressesPayloadToFillPool,
    useWalletApiClients,
    verifySignedData,
} from '@proton/wallet';
import { useGetBitcoinAddressPool, useWalletDispatch, walletAccountUpdate } from '@proton/wallet/store';
import { useGetBitcoinAddressUsedIndexes } from '@proton/wallet/store/hooks/useBitcoinAddressUsedIndexes';

import { useBlockchainClient } from '../../hooks/useBlockchainClient';
import { getAccountWithChainDataFromManyWallets, isUndefined } from '../../utils';
import { useDebounceEffect } from '../../utils/hooks/useDebouncedEffect';

interface WalletEventLoopUpdate {
    WalletBitcoinAddresses?: {
        WalletBitcoinAddress: {
            WalletAccountID: string;
            BitcoinAddress?: string;
            BitcoinAddressIndex?: number;
            Fetched: boolean;
            Used: boolean;
        };
    }[];
    WalletAccounts?: {
        WalletAccount: { ID: string; WalletID: string; LastUsedIndex: number };
    }[];
}

export interface BitcoinAddressHelper {
    receiveBitcoinAddress: WasmAddressInfo;
    generateNewReceiveAddress: () => Promise<void>;
    hasReachedStopGap: boolean;
    willReachStopGap: boolean;
    isLoading: boolean;
}

export const useBitcoinAddresses = ({
    apiWalletsData,
    walletsChainData,
    isSyncing,
    network,
}: {
    apiWalletsData?: IWasmApiWalletData[];
    walletsChainData: SimpleMap<WalletWithChainData>;
    isSyncing: (walletId: string, accountId?: string | undefined) => boolean;
    network: WasmNetwork | undefined;
}) => {
    const api = useWalletApiClients();
    const blockchainClient = useBlockchainClient();
    const dispatch = useWalletDispatch();
    const { subscribe } = useEventManager();

    const getAddressKeys = useGetAddressKeys();
    const getBitcoinAddressPool = useGetBitcoinAddressPool();
    const getBitcoinAddressUsedIndexes = useGetBitcoinAddressUsedIndexes();

    const [bitcoinAddressHelperByWalletAccountId, setBitcoinAddressHelperByWalletAccountId] = useState<
        SimpleMap<BitcoinAddressHelper>
    >({});

    const updateWalletAccountLastUsedIndex = async (
        wallet: WasmApiWallet,
        account: WasmApiWalletAccount,
        lastUsedIndex: number
    ) => {
        try {
            await api.wallet.updateWalletAccountLastUsedIndex(wallet.ID, account.ID, lastUsedIndex);
        } catch {}

        dispatch(
            walletAccountUpdate({
                walletID: wallet.ID,
                walletAccountID: account.ID,
                update: { LastUsedIndex: lastUsedIndex },
            })
        );
    };

    const isIndexUsed = async (lastUsedIndex: number, accountChainData: AccountWithChainData) => {
        if (isUndefined(network)) {
            return false;
        }
        const peekedAddress = await accountChainData.account.peekReceiveAddress(lastUsedIndex);
        const currentAddress = await accountChainData.account.getAddress(
            network,
            peekedAddress.address,
            blockchainClient
        );
        return !!(currentAddress?.Data.transactions && currentAddress.Data.transactions.length > 0);
    };

    const getCurrentReceiveBitcoinAddress = async (
        accountId: string,
        lastUsedIndex: number,
        accountChainData: AccountWithChainData
    ) => {
        const currentHelper = bitcoinAddressHelperByWalletAccountId[accountId];
        if (
            currentHelper &&
            (currentHelper.receiveBitcoinAddress.index > lastUsedIndex ||
                (currentHelper.receiveBitcoinAddress.index === lastUsedIndex &&
                    !(await isIndexUsed(lastUsedIndex, accountChainData))))
        ) {
            return currentHelper.receiveBitcoinAddress;
        }
        return accountChainData.account.getNextReceiveAddress();
    };

    const allWalletAccounts = useMemo(
        () =>
            apiWalletsData?.flatMap((wallet) =>
                wallet.WalletAccounts.map((account) => ({
                    wallet: wallet.Wallet,
                    account: account,
                    isSyncing: isSyncing(account.WalletID, account.ID),
                }))
            ) ?? [],
        [apiWalletsData, isSyncing]
    );

    const walletAccountById: SimpleMap<(typeof allWalletAccounts)[0]> = useMemo(() => {
        const dataByWalletAccountId: {
            [key: string]: { wallet: ApiWalletWithPassphraseInput; account: WasmApiWalletAccount; isSyncing: boolean };
        } = {};
        Object.values(allWalletAccounts).forEach((data) => {
            dataByWalletAccountId[data.account.ID] = data;
        });
        return dataByWalletAccountId;
    }, [allWalletAccounts]);

    const checkBitcoinAddressPool = useCallback(
        async (
            walletAccount: WasmApiWalletAccount,
            wasmAccount: WasmAccount,
            walletAccountAddressKey: DecryptedAddressKey,
            bitcoinAddresses: WasmApiWalletBitcoinAddress[]
        ) => {
            const walletId = walletAccount.WalletID;
            const walletAccountId = walletAccount.ID;

            const addressesToUpdate = await Promise.all(
                bitcoinAddresses.map(async (addr) => {
                    // DB row can be created from a sender request, in this case we want to add the Address and its signature
                    if (!addr.BitcoinAddressSignature || !addr.BitcoinAddress) {
                        return addr;
                    }

                    // Verify if the signature is outdated
                    const isVerified = await verifySignedData(
                        addr.BitcoinAddress,
                        addr.BitcoinAddressSignature,
                        'wallet.bitcoin-address',
                        [walletAccountAddressKey.privateKey]
                    );

                    return isVerified ? undefined : addr;
                })
            );

            for (const addressToUpdate of compact(addressesToUpdate)) {
                try {
                    const addressData = await computeAddress(
                        wasmAccount,
                        walletAccountAddressKey,
                        // Index isn't cleared when BvE is disabled so that when it is turned on again, we can use it
                        addressToUpdate.BitcoinAddressIndex
                    );

                    await api.bitcoin_address.updateBitcoinAddress(
                        walletId,
                        walletAccountId,
                        addressToUpdate.ID,
                        addressData
                    );
                } catch (e) {
                    console.error('Could not update bitcoin address', e);
                }
            }
        },
        []
    );

    const fillBitcoinAddressPool = useCallback(
        async (
            walletAccount: WasmApiWalletAccount,
            wasmAccount: WasmAccount,
            walletAccountAddressKey: DecryptedAddressKey,
            bitcoinAddresses: WasmApiWalletBitcoinAddress[]
        ) => {
            const walletId = walletAccount.WalletID;
            const walletAccountId = walletAccount.ID;

            // Compute missing addresses
            const availableBitcoinAddresses = bitcoinAddresses.filter((a) => !a.Fetched);
            const addressesToCreate = Math.max(0, walletAccount.PoolSize - availableBitcoinAddresses.length);

            // Fill bitcoin address pool
            const addressesPoolPayload = await generateBitcoinAddressesPayloadToFillPool({
                addressesToCreate,
                wasmAccount,
                walletAccountAddressKey,
            });

            if (addressesPoolPayload) {
                try {
                    await api.bitcoin_address.addBitcoinAddresses(walletId, walletAccountId, addressesPoolPayload);
                } catch (e) {
                    console.error('Could not add new bitcoin addresses', e);
                }
            }
        },
        [generateBitcoinAddressesPayloadToFillPool]
    );

    const manageBitcoinAddressPool = useCallback(
        async ({
            wallet,
            account,
            accountChainData,
        }: {
            wallet: WasmApiWallet;
            account: WasmApiWalletAccount;
            accountChainData: AccountWithChainData;
        }) => {
            const firstAddress = account.Addresses.at(0);

            const unusedBitcoinAddresses = await getBitcoinAddressPool(wallet.ID, account.ID);

            // Mark all addresses below in range [0, LastUsedIndex] as used to avoid reusing them
            if (account.LastUsedIndex === 0) {
                await accountChainData.account.markReceiveAddressesUsedTo(0);
            } else {
                await accountChainData.account.markReceiveAddressesUsedTo(0, account.LastUsedIndex);
                await accountChainData.account.markReceiveAddressesUsedTo(account.LastUsedIndex);
            }

            // Mark all addresses already in the pool as used to avoid reusing them
            for (const address of unusedBitcoinAddresses) {
                if (address.BitcoinAddressIndex) {
                    await accountChainData.account.markReceiveAddressesUsedTo(address.BitcoinAddressIndex);
                }
            }

            if (firstAddress) {
                const addressKey = await getAddressKeys(firstAddress.ID);
                const primaryAddressKey = addressKey.at(0);

                if (primaryAddressKey) {
                    await checkBitcoinAddressPool(
                        account,
                        accountChainData.account,
                        primaryAddressKey,
                        unusedBitcoinAddresses
                    );

                    await fillBitcoinAddressPool(
                        account,
                        accountChainData.account,
                        primaryAddressKey,
                        unusedBitcoinAddresses
                    );
                }
            }

            return unusedBitcoinAddresses;
        },
        [checkBitcoinAddressPool, fillBitcoinAddressPool, getAddressKeys]
    );

    const updateBitcoinAddressHelper = useCallback((accountId: string, update: Partial<BitcoinAddressHelper>) => {
        setBitcoinAddressHelperByWalletAccountId((prev) => {
            const prevAccount = prev[accountId];
            return {
                ...prev,
                ...(prevAccount && { [accountId]: { ...prevAccount, ...update } }),
            };
        });
    }, []);

    const manageEmptyBitcoinAddressPool = useCallback(
        async ({
            wallet,
            account,
            accountChainData,
            receiveBitcoinAddress,
            unusedAddresses,
        }: {
            wallet: WasmApiWallet;
            account: WasmApiWalletAccount;
            accountChainData: AccountWithChainData;
            receiveBitcoinAddress: WasmAddressInfo;
            unusedAddresses: WasmApiWalletBitcoinAddress[];
        }) => {
            const indexes = unusedAddresses
                .map((address) => address.BitcoinAddressIndex)
                .filter((index) => index !== null);

            // If current receive Bitcoin address index is part of the Bitcoin via Email pool, get next unused address and update helper
            if (indexes.includes(receiveBitcoinAddress.index)) {
                const newReceiveBitcoinAddress = await accountChainData.account.getNextReceiveAddress();
                await updateWalletAccountLastUsedIndex(wallet, account, newReceiveBitcoinAddress.index);
                return newReceiveBitcoinAddress;
            }

            return receiveBitcoinAddress;
        },
        []
    );

    useEffect(() => {
        return subscribe(async (update) => {
            const { WalletBitcoinAddresses = [], WalletAccounts = [] } = update as WalletEventLoopUpdate; // TODO: Fix these types
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

            // Make sure pool is updated on event
            for (const walletAccountId of walletAccountIds) {
                const data = walletAccountById[walletAccountId];
                const accountChainData = getAccountWithChainDataFromManyWallets(
                    walletsChainData,
                    data?.wallet.ID,
                    data?.account.ID
                );

                if (data && accountChainData) {
                    await manageBitcoinAddressPool({
                        wallet: data.wallet,
                        account: data.account,
                        accountChainData,
                    });

                    const walletBitcoinAddressesOfAccount = WalletBitcoinAddresses.filter(
                        ({ WalletBitcoinAddress: b }) => b.WalletAccountID === walletAccountId
                    );

                    for (const walletBitcoinAddress of walletBitcoinAddressesOfAccount) {
                        if (
                            walletBitcoinAddress.WalletBitcoinAddress.Used &&
                            walletBitcoinAddress.WalletBitcoinAddress.BitcoinAddressIndex
                        ) {
                            await accountChainData.account.markReceiveAddressesUsedTo(
                                walletBitcoinAddress.WalletBitcoinAddress.BitcoinAddressIndex
                            );
                        }
                    }
                }
            }

            // Use latest LastUsedIndex
            for (const walletAccount of WalletAccounts) {
                const accountChainData = getAccountWithChainDataFromManyWallets(
                    walletsChainData,
                    walletAccount.WalletAccount.WalletID,
                    walletAccount.WalletAccount.ID
                );

                if (!accountChainData) {
                    continue;
                }

                updateBitcoinAddressHelper(walletAccount.WalletAccount.ID, { isLoading: true });

                // Naming is wrong but LastUsedIndex is actually the next index to use
                const nextIndexToUse = walletAccount.WalletAccount.LastUsedIndex;

                // Mark all addresses below in range [0, LastUsedIndex[ as used to avoid reusing them
                await accountChainData.account.markReceiveAddressesUsedTo(0, nextIndexToUse);

                // Check if current displayed address is still ok
                const currentReceiveBitcoinAddress = await getCurrentReceiveBitcoinAddress(
                    walletAccount.WalletAccount.ID,
                    walletAccount.WalletAccount.LastUsedIndex,
                    accountChainData
                );
                updateBitcoinAddressHelper(walletAccount.WalletAccount.ID, {
                    receiveBitcoinAddress: currentReceiveBitcoinAddress,
                    isLoading: false,
                });
            }
        });
    }, [
        bitcoinAddressHelperByWalletAccountId,
        manageBitcoinAddressPool,
        subscribe,
        updateBitcoinAddressHelper,
        walletAccountById,
        walletsChainData,
    ]);

    useDebounceEffect(
        () => {
            const run = async () => {
                for (const accountData of allWalletAccounts) {
                    const { wallet, account, isSyncing } = accountData;

                    // Make sure account is fully synced before processing bitcoin addresses
                    if (isSyncing) {
                        return;
                    }

                    const accountChainData = getAccountWithChainDataFromManyWallets(
                        walletsChainData,
                        wallet.ID,
                        account.ID
                    );

                    if (!accountChainData) {
                        return;
                    }

                    // Mark as loading state during the whole useEffect
                    updateBitcoinAddressHelper(account.ID, {
                        isLoading: true,
                    });

                    // Mark all addresses below in range [0, LastUsedIndex[ as used to avoid reusing them
                    // Next instructions will get index LastUsedIndex with getNextReceiveAddress()
                    if (account.LastUsedIndex > 0) {
                        await accountChainData.account.markReceiveAddressesUsedTo(0, account.LastUsedIndex);
                    }

                    // Mark all used indexes as used to avoid reusing them
                    const usedIndexes = (await getBitcoinAddressUsedIndexes(wallet.ID, account.ID)).map((index) =>
                        Number(index)
                    );
                    for (const index of usedIndexes) {
                        await accountChainData.account.markReceiveAddressesUsedTo(index);
                    }

                    // Get next potential receive address and update LU if it changed
                    const receiveBitcoinAddress = await getCurrentReceiveBitcoinAddress(
                        account.ID,
                        account.LastUsedIndex,
                        accountChainData
                    );
                    if (receiveBitcoinAddress.index !== account.LastUsedIndex) {
                        await updateWalletAccountLastUsedIndex(wallet, account, receiveBitcoinAddress.index);
                    }

                    const unusedAddresses = await manageBitcoinAddressPool({ wallet, account, accountChainData });

                    // This will ensure we do not have a receive Bitcoin address using an index from the pool
                    const finalReceiveBitcoinAddress = await manageEmptyBitcoinAddressPool({
                        wallet,
                        account,
                        accountChainData,
                        receiveBitcoinAddress,
                        unusedAddresses,
                    });

                    const highestUsedAddressIndexInOutput =
                        await accountChainData.account.getHighestUsedAddressIndexInOutput(WasmKeychainKind.External);

                    const generateNewReceiveAddress = async () => {
                        if (isSyncing) {
                            return;
                        }

                        updateBitcoinAddressHelper(account.ID, { isLoading: true });

                        const newReceiveBitcoinAddress = await accountChainData.account.getNextReceiveAddress();

                        await updateWalletAccountLastUsedIndex(wallet, account, newReceiveBitcoinAddress.index);

                        // In order to avoid blinking display and timing issue, do not set isLoading as true here
                        // There is a dispatch call in the previous function that will take care of it
                        updateBitcoinAddressHelper(account.ID, {
                            receiveBitcoinAddress: newReceiveBitcoinAddress,
                            isLoading: true,
                        });
                    };

                    // Persist with generate new receive address function and set loading to false
                    setBitcoinAddressHelperByWalletAccountId((prev) => ({
                        ...prev,
                        [account.ID]: {
                            receiveBitcoinAddress: finalReceiveBitcoinAddress,
                            generateNewReceiveAddress,
                            hasReachedStopGap: !!(
                                highestUsedAddressIndexInOutput &&
                                highestUsedAddressIndexInOutput + 20 <= account.LastUsedIndex
                            ),
                            willReachStopGap: !!(
                                highestUsedAddressIndexInOutput &&
                                highestUsedAddressIndexInOutput + 10 <= account.LastUsedIndex
                            ),
                            isLoading: false,
                        },
                    }));
                }
            };

            void run();
        },
        [allWalletAccounts, manageBitcoinAddressPool, updateBitcoinAddressHelper, walletsChainData],
        2 * SECOND
    );

    return {
        bitcoinAddressHelperByWalletAccountId,
        manageBitcoinAddressPool,
    };
};
