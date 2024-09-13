import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isBefore, sub } from 'date-fns';
import pick from 'lodash/pick';
import set from 'lodash/set';
import { c } from 'ttag';

import { WasmWallet, getDefaultStopGap } from '@proton/andromeda';
import { MINUTE } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import generateUID from '@proton/utils/generateUID';
import type { IWasmApiWalletData } from '@proton/wallet';
import { POOL_FILLING_THRESHOLD, useGetBitcoinNetwork } from '@proton/wallet';

import { SYNCING_MINIMUM_COOLDOWN_MINUTES } from '../../constants/wallet';
import { useBlockchainClient } from '../../hooks/useBlockchainClient';
import { useMirroredRef } from '../../hooks/useMirrorredRef';
import type {
    AccountChainDataByAccountId,
    AccountIdByDerivationPathAndWalletId,
    WalletChainDataByWalletId,
} from '../../types';
import { removeMasterPrefix } from '../../utils';

export type SyncingMetadata = { syncing: boolean; count: number; lastSyncing: number; error: string | null };

const POLLING_UID_PREFIX = 'polling';

const getKey = (walletId: string, walletAccountID: string) => {
    return `${walletId}-${walletAccountID}`;
};

/**
 * Returns chain data given API wallets
 */
export const useWalletsChainData = (apiWalletsData?: IWasmApiWalletData[]) => {
    const blockchainClient = useBlockchainClient();

    const pollingIdRef = useRef<string>();

    const getNetwork = useGetBitcoinNetwork();

    const [walletsChainData, setWalletsChainData] = useState<WalletChainDataByWalletId>();

    const walletsChainDataRef = useRef<WalletChainDataByWalletId>();

    const getWalletsChainDataInit = useCallback(
        async (apiWalletsData?: IWasmApiWalletData[]) => {
            const network = await getNetwork();

            const walletsChainData = apiWalletsData?.reduce((acc: WalletChainDataByWalletId, apiWallet) => {
                const { Wallet, WalletAccounts, IsNotDecryptable } = apiWallet;

                // TODO: support watch-only wallets
                if (IsNotDecryptable || !Wallet.Mnemonic || (Wallet.HasPassphrase && !Wallet.Passphrase)) {
                    return acc;
                }

                const wasmWallet = new WasmWallet(network, Wallet.Mnemonic, Wallet.Passphrase ?? '');

                // Get accounts created in wasm wallet
                const wasmAccounts = WalletAccounts.reduce((acc: AccountChainDataByAccountId, account) => {
                    const wasmAccount = wasmWallet.addAccount(account.ScriptType, account.DerivationPath);

                    return {
                        ...acc,
                        [account.ID]: {
                            account: wasmAccount,
                            scriptType: account.ScriptType,
                            derivationPath: account.DerivationPath,
                        },
                    };
                }, {});

                return {
                    ...acc,
                    [Wallet.ID]: {
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

    const [syncingMetatadaByAccountId, setSyncingMetatadaByAccountId] = useState<
        Partial<Record<string, SyncingMetadata>>
    >({});

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

            if (account && canSync) {
                try {
                    const wasmAccount = account.account;

                    addNewSyncing(walletId, accountId);

                    // If syncing is manual, we do a full sync
                    if ((await wasmAccount.hasSyncData()) && !manual) {
                        await blockchainClient.partialSync(wasmAccount);
                    } else {
                        await blockchainClient.fullSync(wasmAccount, getDefaultStopGap() + POOL_FILLING_THRESHOLD);
                    }

                    incrementSyncKey(walletId, accountId);
                } catch (error: any) {
                    const message = error?.error ?? c('Wallet').t`An error occurred`;
                    syncingFailed(walletId, accountId, message);
                } finally {
                    removeSyncing(walletId, accountId);
                }
            }
        },
        [addNewSyncing, removeSyncing, incrementSyncKey, syncingFailed, syncingMetatadaByAccountIdRef, blockchainClient]
    );

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
            while (pollingIdRef.current == pollingId && init) {
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
            const init = await getWalletsChainDataInit(apiWalletsData);
            if (init) {
                void startPolling(init);
            }
        };

        void run();

        return () => {
            pollingIdRef.current = undefined;
        };
    }, [getWalletsChainDataInit, apiWalletsData, startPolling]);

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
