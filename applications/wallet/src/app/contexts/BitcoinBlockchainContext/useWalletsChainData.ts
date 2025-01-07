import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isBefore, sub } from 'date-fns';
import isEqual from 'lodash/isEqual';
import pick from 'lodash/pick';
import set from 'lodash/set';
import { c } from 'ttag';

import type { WasmNetwork } from '@proton/andromeda';
import { WasmWallet, getDefaultStopGap } from '@proton/andromeda';
import usePrevious from '@proton/hooks/usePrevious';
import { MINUTE } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { type SimpleMap } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';
import generateUID from '@proton/utils/generateUID';
import type { IWasmApiWalletData } from '@proton/wallet';
import { SYNCING_MINIMUM_COOLDOWN_MINUTES } from '@proton/wallet';
import { useWalletApiClients } from '@proton/wallet';
import { useGetBitcoinNetwork, useWalletDispatch, walletAccountUpdate } from '@proton/wallet/store';

import { useBlockchainClient } from '../../hooks/useBlockchainClient';
import { useMirroredRef } from '../../hooks/useMirrorredRef';
import type {
    AccountChainDataByAccountId,
    AccountIdByDerivationPathAndWalletId,
    WalletChainDataByWalletId,
} from '../../types';
import { removeMasterPrefix } from '../../utils';
import { clearChangeSet, isFullSyncDone, setFullSyncDone } from '../../utils/cache';

export type SyncingMetadata = { syncing: boolean; count: number; lastSyncing: number; error: string | null };

const POLLING_UID_PREFIX = 'polling';

const getKey = (walletId: string, walletAccountID: string) => {
    return `${walletId}-${walletAccountID}`;
};

interface WalletSubsetData {
    IsNotDecryptable: boolean | undefined;
    WalletAccounts: {
        ID: string;
        ScriptType: number;
        DerivationPath: string;
        PoolSize: number;
        LastUsedIndex: number;
    }[];
    ID: string;
    Mnemonic: string | null;
    Passphrase?: string | undefined;
    HasPassphrase: number;
}

export const formatToSubset = (apiWalletsData?: IWasmApiWalletData[]): WalletSubsetData[] | undefined =>
    apiWalletsData?.map(({ Wallet, WalletAccounts, IsNotDecryptable }) => ({
        ...pick(Wallet, ['ID', 'Mnemonic', 'Passphrase', 'HasPassphrase']),
        IsNotDecryptable,
        WalletAccounts: WalletAccounts.map(({ ID, ScriptType, DerivationPath, PoolSize, LastUsedIndex }) => ({
            ID,
            ScriptType,
            DerivationPath,
            PoolSize,
            LastUsedIndex,
        })),
    }));

export const getWalletsChainDataInit = async ({
    apiWalletsData,
    network,
}: {
    apiWalletsData: WalletSubsetData[];
    network: WasmNetwork;
}) => {
    const walletsChainData = apiWalletsData?.reduce((acc: WalletChainDataByWalletId, apiWallet) => {
        const { ID, Mnemonic, HasPassphrase, Passphrase, WalletAccounts, IsNotDecryptable } = apiWallet;

        // TODO: support watch-only wallets
        if (IsNotDecryptable || !Mnemonic || (HasPassphrase && !Passphrase)) {
            return acc;
        }

        const wasmWallet = new WasmWallet(network, Mnemonic, Passphrase ?? '');

        // Get accounts created in wasm wallet
        const wasmAccounts = WalletAccounts.reduce((acc: AccountChainDataByAccountId, account) => {
            const wasmAccount = wasmWallet.addAccount(account.ScriptType, account.DerivationPath);

            return {
                ...acc,
                [account.ID]: {
                    account: wasmAccount,
                    scriptType: account.ScriptType,
                    derivationPath: account.DerivationPath,
                    poolSize: account.PoolSize,
                    lastUsedIndex: account.LastUsedIndex,
                },
            };
        }, {});

        return {
            ...acc,
            [ID]: {
                wallet: wasmWallet,
                accounts: wasmAccounts,
            },
        };
    }, {});

    return walletsChainData;
};

/**
 * Returns chain data given API wallets
 */
export const useWalletsChainData = (apiWalletsData?: IWasmApiWalletData[]) => {
    const blockchainClient = useBlockchainClient();

    const api = useWalletApiClients();

    const dispatch = useWalletDispatch();

    const isWalletFullSync = useFlag('WalletFullSync');

    const pollingIdRef = useRef<string>();

    const getNetwork = useGetBitcoinNetwork();

    const [walletsChainData, setWalletsChainData] = useState<WalletChainDataByWalletId>();

    const walletsChainDataRef = useRef<WalletChainDataByWalletId>();

    const walletSubsetData = useMemo(() => formatToSubset(apiWalletsData), [apiWalletsData]);

    const previousWalletSubsetData = usePrevious(walletSubsetData);

    const getWalletsChainDataInit = useCallback(
        async (apiWalletsData?: typeof walletSubsetData) => {
            const network = await getNetwork();

            const walletsChainData = apiWalletsData?.reduce((acc: WalletChainDataByWalletId, apiWallet) => {
                const { ID, Mnemonic, HasPassphrase, Passphrase, WalletAccounts, IsNotDecryptable } = apiWallet;

                // TODO: support watch-only wallets
                if (IsNotDecryptable || !Mnemonic || (HasPassphrase && !Passphrase)) {
                    return acc;
                }

                const wasmWallet = new WasmWallet(network, Mnemonic, Passphrase ?? '');

                // Get accounts created in wasm wallet
                const wasmAccounts = WalletAccounts.reduce((acc: AccountChainDataByAccountId, account) => {
                    try {
                        const wasmAccount = wasmWallet.addAccount(account.ScriptType, account.DerivationPath);
                        return {
                            ...acc,
                            [account.ID]: {
                                account: wasmAccount,
                                scriptType: account.ScriptType,
                                derivationPath: account.DerivationPath,
                                poolSize: account.PoolSize,
                                lastUsedIndex: account.LastUsedIndex,
                            },
                        };
                    } catch (e: any) {
                        clearChangeSet(wasmWallet.getFingerprint());
                        throw e;
                    }
                }, {});

                return {
                    ...acc,
                    [ID]: {
                        wallet: wasmWallet,
                        accounts: wasmAccounts,
                    },
                };
            }, {});

            return walletsChainData;
        },
        // Here getNetwork dependency creates an infinite loop in testing because mocked hook cannot be memoized
        []
    );

    const [syncingMetatadaByAccountId, setSyncingMetatadaByAccountId] = useState<SimpleMap<SyncingMetadata>>({});

    // We use refs coupled to the state to deps from the syncing loop
    const syncingMetatadaByAccountIdRef = useMirroredRef(syncingMetatadaByAccountId, {});

    const incrementSyncKey = useCallback((walletId: string, accountId: string) => {
        setWalletsChainData((prev) => {
            const wallet = prev && prev[walletId];
            const account = wallet && wallet.accounts[accountId];

            return (
                account && {
                    ...prev,
                    [walletId]: {
                        ...wallet,
                        accounts: {
                            ...prev[walletId]?.accounts,
                            [accountId]: {
                                ...account,
                                key: generateUID('wallet-sync'),
                            },
                        },
                    },
                }
            );
        });
    }, []);

    const addNewSyncing = useCallback((walletId: string, walletAccountID: string) => {
        const key = getKey(walletId, walletAccountID);

        setSyncingMetatadaByAccountId((prev) => ({
            ...prev,
            [key]: {
                syncing: true,
                lastSyncing: Date.now(),
                count: (prev[key]?.count ?? 0) + 1,
                error: null,
            },
        }));
    }, []);

    const removeSyncing = useCallback((walletId: string, walletAccountID: string) => {
        setSyncingMetatadaByAccountId((prev) =>
            set({ ...prev }, [getKey(walletId, walletAccountID), 'syncing'], false)
        );
    }, []);

    const syncingFailed = useCallback((walletId: string, walletAccountID: string, error: string) => {
        setSyncingMetatadaByAccountId((prev) => set({ ...prev }, [getKey(walletId, walletAccountID), 'error'], error));
    }, []);

    const syncSingleWalletAccount = useCallback(
        async ({ walletId, accountId, manual }: { walletId: string; accountId: string; manual?: boolean }) => {
            const metadata = syncingMetatadaByAccountIdRef.current[getKey(walletId, accountId)];

            // We enforce a cooldown between each sync
            const canSync =
                !metadata ||
                (!metadata.syncing &&
                    (!metadata.lastSyncing ||
                        isBefore(
                            metadata.lastSyncing,
                            sub(new Date(), { seconds: SYNCING_MINIMUM_COOLDOWN_MINUTES })
                        )));

            const account = walletsChainDataRef.current?.[walletId]?.accounts[accountId];
            const derivationPath = walletsChainDataRef.current?.[walletId]?.accounts[accountId]?.derivationPath ?? '';
            const fingerprint = walletsChainDataRef.current?.[walletId]?.wallet.getFingerprint() ?? '';

            if (account && canSync) {
                try {
                    let fullSyncDone = isFullSyncDone(fingerprint, derivationPath);

                    const wasmAccount = account.account;

                    addNewSyncing(walletId, accountId);

                    // If syncing is manual, we do a full sync
                    if (isWalletFullSync && !fullSyncDone) {
                        await blockchainClient.fullSync(wasmAccount, 500);
                        await blockchainClient.partialSync(wasmAccount);
                        setFullSyncDone(fingerprint, derivationPath);
                        // after full sync, double-check the LastUsedIndex
                        // lookup LU:20 we should load 0 ... 20 and peek will get 21.
                        await wasmAccount.markReceiveAddressesUsedTo(0, account.lastUsedIndex);
                        await wasmAccount.markReceiveAddressesUsedTo(account.lastUsedIndex);
                    } else if ((await wasmAccount.hasSyncData()) && !manual) {
                        await blockchainClient.partialSync(wasmAccount);
                    } else {
                        // before full sync, we check the stop gap
                        const stopGap = getDefaultStopGap() + account.poolSize;
                        await blockchainClient.fullSync(wasmAccount, stopGap);
                        await blockchainClient.partialSync(wasmAccount);
                    }

                    // Compare LastUsedIndex and getHighestUsedAddressIndexInOutput, and update LastUsedIndex
                    await compareIndexAndMarkUsedTo(walletId, accountId, wasmAccount, account.lastUsedIndex);

                    incrementSyncKey(walletId, accountId);
                } catch (error: any) {
                    const message =
                        error?.error ?? c('Wallet').t`An error occurred whilst syncing your wallet. Please try again.`;
                    syncingFailed(walletId, accountId, message);
                } finally {
                    removeSyncing(walletId, accountId);
                }
            }
        },
        [addNewSyncing, removeSyncing, incrementSyncKey, syncingFailed, syncingMetatadaByAccountIdRef, blockchainClient]
    );

    /**
     * Compare LastUsedIndex from the account object with the result of wasmAccount.getHighestUsedAddressIndexInOutput().
     */
    async function compareIndexAndMarkUsedTo(
        walletId: string,
        accountId: string,
        wasmAccount: any,
        lastUsedIndex: number
    ) {
        const addressIndexInOutput = await wasmAccount.getHighestUsedAddressIndexInOutput();

        // Compare LastUsedIndex and addressIndexInOutput and handle accordingly
        if (addressIndexInOutput >= lastUsedIndex) {
            await wasmAccount.markReceiveAddressesUsedTo(0, addressIndexInOutput);
            const receiveBitcoinAddress = await wasmAccount.getNextReceiveAddress();

            await api.wallet.updateWalletAccountLastUsedIndex(walletId, accountId, receiveBitcoinAddress.index);

            dispatch(
                walletAccountUpdate({
                    walletID: walletId,
                    walletAccountID: accountId,
                    update: { LastUsedIndex: receiveBitcoinAddress.index },
                })
            );
        }
    }

    const syncSingleWallet = useCallback(
        async ({ walletId, manual }: { walletId: string; manual?: boolean }) => {
            const wallet = walletsChainDataRef.current?.[walletId];

            return Promise.all(
                Object.keys(wallet?.accounts ?? []).map((accountId) => {
                    return syncSingleWalletAccount({ walletId, accountId, manual });
                })
            );
        },

        [syncSingleWalletAccount]
    );

    const syncManyWallets = useCallback(
        async ({ walletIds, manual }: { walletIds: string[]; manual?: boolean }) => {
            return Promise.all(
                Object.keys(pick(walletsChainDataRef.current, walletIds)).map((walletId) => {
                    return syncSingleWallet({ walletId, manual });
                })
            );
        },
        [syncSingleWallet]
    );

    const startPolling = useCallback(
        async (init: WalletChainDataByWalletId) => {
            const pollingId = generateUID(POLLING_UID_PREFIX);
            pollingIdRef.current = pollingId;

            setWalletsChainData(init);
            walletsChainDataRef.current = init;

            // This ensure that if another poll is start (via calling this fn), previous one will be stoped: uuid won't match anymore
            while (pollingIdRef.current == pollingId) {
                await syncManyWallets({
                    walletIds: Object.keys(init),
                });

                await wait(10 * MINUTE);
            }
        },
        [syncManyWallets]
    );

    useEffect(() => {
        const run = async () => {
            // We only want to start polling if there is a change in relevant data
            if (!isEqual(walletSubsetData, previousWalletSubsetData)) {
                const init = await getWalletsChainDataInit(walletSubsetData);
                if (init) {
                    void startPolling(init);
                }
            }
        };

        void run();
    }, [getWalletsChainDataInit, walletSubsetData, previousWalletSubsetData, startPolling]);

    // We need this reversed map to reconciliate WalletId+DerivationPath -> AccountId
    const accountIDByDerivationPathByWalletID = useMemo(() => {
        return Object.entries(walletsChainData ?? {}).reduce(
            (acc: AccountIdByDerivationPathAndWalletId, [walletId, walletChainData]) => ({
                ...acc,
                [walletId]: Object.entries(walletChainData?.accounts ?? {}).reduce(
                    (acc, [accountId, accountData]) =>
                        accountData ? { ...acc, [removeMasterPrefix(accountData.derivationPath)]: accountId } : acc,
                    {}
                ),
            }),
            {}
        );
    }, [walletsChainData]);

    const getSyncingData = useCallback(
        (walletId: string, walletAccountID?: string) => {
            if (!walletAccountID) {
                return Object.entries(syncingMetatadaByAccountId).find(([key]) => key.startsWith(walletId))?.[1];
            }

            return syncingMetatadaByAccountId[getKey(walletId, walletAccountID)];
        },
        [syncingMetatadaByAccountId]
    );

    const isSyncing = useCallback(
        (walletId: string, accountId?: string) => {
            return Boolean(getSyncingData(walletId, accountId)?.syncing);
        },
        [getSyncingData]
    );

    return {
        syncingMetatadaByAccountId,
        walletsChainData: walletsChainData ?? {},
        accountIDByDerivationPathByWalletID,

        syncManyWallets,
        syncSingleWallet,
        syncSingleWalletAccount,
        incrementSyncKey,

        getSyncingData,
        isSyncing,
    };
};
