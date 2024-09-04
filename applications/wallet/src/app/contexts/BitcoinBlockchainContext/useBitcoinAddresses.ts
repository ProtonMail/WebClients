import { useCallback, useEffect, useMemo, useState } from 'react';

import compact from 'lodash/compact';
import keyBy from 'lodash/keyBy';
import uniq from 'lodash/uniq';

import {
    type WasmAccount,
    type WasmAddressInfo,
    type WasmApiWallet,
    type WasmApiWalletAccount,
    type WasmApiWalletBitcoinAddressData,
} from '@proton/andromeda';
import { useEventManager, useGetAddressKeys } from '@proton/components/hooks';
import { type DecryptedAddressKey, type SimpleMap } from '@proton/shared/lib/interfaces';
import {
    type AccountWithChainData,
    type IWasmApiWalletData,
    type WalletWithChainData,
    computeAddress,
    generateBitcoinAddressesPayloadToFillPool,
    useWalletApiClients,
    verifySignedData,
} from '@proton/wallet';

import { useItemEffect } from '../../hooks/useItemEffect';
import { getAccountWithChainDataFromManyWallets } from '../../utils';

export interface BitcoinAddressHelper {
    receiveBitcoinAddress: WasmAddressInfo;
    generateNewReceiveAddress: () => Promise<void>;
    isLoading: boolean;
}

export const useBitcoinAddresses = ({
    decryptedApiWalletsData,
    walletsChainData,
    isSyncing,
}: {
    decryptedApiWalletsData?: IWasmApiWalletData[];
    walletsChainData: Partial<Record<string, WalletWithChainData>>;
    isSyncing: (walletId: string, accountId?: string | undefined) => boolean;
}) => {
    const api = useWalletApiClients();
    const { subscribe } = useEventManager();

    const getAddressKeys = useGetAddressKeys();

    const [bitcoinAddressHelperByWalletAccountId, setBitcoinAddressHelperByWalletAccountId] = useState<
        SimpleMap<BitcoinAddressHelper>
    >({});

    const allWalletAccounts = useMemo(
        () =>
            decryptedApiWalletsData?.flatMap((wallet) =>
                wallet.WalletAccounts.map((account) => ({
                    wallet: wallet.Wallet,
                    account: account,
                    isSyncing: isSyncing(account.WalletID, account.ID),
                }))
            ) ?? [],
        [decryptedApiWalletsData, isSyncing]
    );

    const walletAccountById: SimpleMap<(typeof allWalletAccounts)[0]> = useMemo(
        () => keyBy(allWalletAccounts, 'id'),
        [allWalletAccounts]
    );

    const completeBitcoinAddressPool = useCallback(
        async (
            walletAccount: WasmApiWalletAccount,
            wasmAccount: WasmAccount,
            walletAccountAddressKey: DecryptedAddressKey,
            bitcoinAddresses: WasmApiWalletBitcoinAddressData[]
        ) => {
            const walletId = walletAccount.WalletID;
            const walletAccountId = walletAccount.ID;

            const addressesToUpdate = await Promise.all(
                bitcoinAddresses.map(async (addr) => {
                    // DB row can be created from a sender request, in this case we want to add the Address and its signature
                    if (!addr.Data.BitcoinAddressSignature || !addr.Data.BitcoinAddress) {
                        return addr;
                    }

                    // Verify if the signature is outdate
                    const isVerified = await verifySignedData(
                        addr.Data.BitcoinAddress,
                        addr.Data.BitcoinAddressSignature,
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
                        addressToUpdate.Data.BitcoinAddressIndex
                    );

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
        []
    );

    const fillBitcoinAddressPool = useCallback(
        async (
            walletAccount: WasmApiWalletAccount,
            wasmAccount: WasmAccount,
            walletAccountAddressKey: DecryptedAddressKey,
            bitcoinAddresses: WasmApiWalletBitcoinAddressData[]
        ) => {
            const walletId = walletAccount.WalletID;
            const walletAccountId = walletAccount.ID;

            // Compute missing addresses
            const availableBitcoinAddresses = bitcoinAddresses.filter((a) => !a.Data.Fetched);
            const addressesToCreate = Math.max(0, walletAccount.PoolSize - availableBitcoinAddresses.length);

            // Fill bitcoin address pool
            const addressesPoolPayload = await generateBitcoinAddressesPayloadToFillPool({
                addressesToCreate,
                wasmAccount,
                walletAccountAddressKey,
            });

            if (addressesPoolPayload) {
                try {
                    await api.bitcoin_address.addBitcoinAddress(walletId, walletAccountId, addressesPoolPayload);
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

            const unusedBitcoinAddresses = await api.bitcoin_address
                .getBitcoinAddresses(wallet.ID, account.ID)
                .then((data) => data[0]);

            // Mark all addresses already in the pool as used to avoid reusing them
            for (const address of unusedBitcoinAddresses) {
                if (address.Data.BitcoinAddressIndex) {
                    await accountChainData.account.markReceiveAddressesUsedTo(address.Data.BitcoinAddressIndex);
                }
            }

            if (firstAddress) {
                const addressKey = await getAddressKeys(firstAddress.ID);
                const primaryAddressKey = addressKey.at(0);

                if (primaryAddressKey) {
                    await completeBitcoinAddressPool(
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
        },
        [completeBitcoinAddressPool, fillBitcoinAddressPool, getAddressKeys]
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

    useEffect(() => {
        return subscribe(
            async ({
                WalletBitcoinAddresses = [],
                WalletAccounts = [],
            }: {
                WalletBitcoinAddresses: {
                    WalletBitcoinAddress: {
                        WalletAccountID: string;
                        BitcoinAddress?: string;
                        Fetched: boolean;
                        Used: boolean;
                    };
                }[];
                WalletAccounts: {
                    WalletAccount: { ID: string; WalletID: string; LastUsedIndex: number };
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

                    // Naming is wrong but LastUsedIndex is actually the next index to use
                    const nextIndexToUse = walletAccount.WalletAccount.LastUsedIndex;

                    // Mark all addresses below in range [0, LastUsedIndex] as used to avoid reusing them
                    await accountChainData.account.markReceiveAddressesUsedTo(0, nextIndexToUse);

                    // Check if current displayed address is still ok
                    const currentHelpers = bitcoinAddressHelperByWalletAccountId[walletAccount.WalletAccount.ID];

                    if (
                        currentHelpers?.receiveBitcoinAddress.index &&
                        currentHelpers.receiveBitcoinAddress.index <= nextIndexToUse - 1
                    ) {
                        const receiveBitcoinAddress = await accountChainData.account.getNextReceiveAddress();
                        updateBitcoinAddressHelper(walletAccount.WalletAccount.ID, { receiveBitcoinAddress });
                    }
                }
            }
        );
    }, [
        bitcoinAddressHelperByWalletAccountId,
        manageBitcoinAddressPool,
        subscribe,
        updateBitcoinAddressHelper,
        walletAccountById,
        walletsChainData,
    ]);

    useItemEffect(
        (accountData) => {
            const { wallet, account, isSyncing } = accountData;

            // Make sure account is fully synced before processing bitcoin addresses
            if (isSyncing || !!bitcoinAddressHelperByWalletAccountId[account.ID]) {
                return;
            }

            const run = async () => {
                const accountChainData = getAccountWithChainDataFromManyWallets(
                    walletsChainData,
                    wallet.ID,
                    account.ID
                );

                if (!accountChainData) {
                    return;
                }

                // Mark all addresses below in range [0, LastUsedIndex[ as used to avoid reusing them
                await accountChainData.account.markReceiveAddressesUsedTo(0, account.LastUsedIndex);

                await manageBitcoinAddressPool({ wallet, account, accountChainData });

                // TODO: check if rerenders don't create bad stuff
                const receiveBitcoinAddress = await accountChainData.account.getNextReceiveAddress();

                const generateNewReceiveAddress = async () => {
                    if (isSyncing) {
                        return;
                    }

                    updateBitcoinAddressHelper(account.ID, { isLoading: true });

                    const newReceiveBitcoinAddress = await accountChainData.account.getNextReceiveAddress();

                    try {
                        // Update last used index to avoid reusing the new address
                        // LastUsedIndex is actually the next index to use in case of a refresh
                        await api.wallet.updateWalletAccountLastUsedIndex(
                            wallet.ID,
                            account.ID,
                            newReceiveBitcoinAddress.index
                        );
                    } catch {}

                    updateBitcoinAddressHelper(account.ID, {
                        receiveBitcoinAddress: newReceiveBitcoinAddress,
                        isLoading: false,
                    });
                };

                setBitcoinAddressHelperByWalletAccountId((prev) => ({
                    ...prev,
                    [account.ID]: {
                        receiveBitcoinAddress,
                        generateNewReceiveAddress,
                        isLoading: isSyncing,
                    },
                }));
            };

            void run();
        },
        allWalletAccounts,
        [walletsChainData, updateBitcoinAddressHelper]
    );

    return {
        bitcoinAddressHelperByWalletAccountId,
        manageBitcoinAddressPool,
    };
};
