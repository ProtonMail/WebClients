import { useCallback, useMemo, useRef, useState } from 'react';

import { isBefore, sub } from 'date-fns';
import { set } from 'lodash';
import { c } from 'ttag';

import { WasmWallet, getDefaultStopGap } from '@proton/andromeda';
import generateUID from '@proton/atoms/generateUID';
import { useNotifications } from '@proton/components/hooks';
import { MINUTE } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { IWasmApiWalletData } from '@proton/wallet';

import { POOL_FILLING_THRESHOLD } from '../../constants/email-integration';
import { SYNCING_MINIMUM_COOLDOWN_MINUTES } from '../../constants/wallet';
import { useBlockchainClient } from '../../hooks/useBlockchainClient';
import { useMirroredRef } from '../../hooks/useMirrorredRef';
import { useBitcoinNetwork } from '../../store/hooks';
import {
    AccountChainDataByAccountId,
    AccountIdByDerivationPathAndWalletId,
    WalletChainDataByWalletId,
} from '../../types';
import { isUndefined } from '../../utils';
import { useDebounceEffect } from '../../utils/hooks/useDebouncedEffect';

export type SyncingMetadata = { syncing: boolean; count: number; lastSyncing: number };

const POLLING_UID_PREFIX = 'polling';

/**
 * Returns chain data given API wallets
 */
export const useWalletsChainData = (apiWalletsData?: IWasmApiWalletData[], onSyncingFinished?: () => void) => {
    const blockchainClient = useBlockchainClient();
    const pollingIdRef = useRef<string>();

    const [network] = useBitcoinNetwork();

    const { createNotification } = useNotifications();

    const [walletsChainData, setWalletsChainData] = useState<WalletChainDataByWalletId>();

    // Data used to iterate over to sync accounts
    // Here undefined means there is no wallet loaded yet, it is different from {} which means that there is no wallet TO BE loaded
    const initWalletsChainData: WalletChainDataByWalletId | undefined = useMemo(() => {
        if (!apiWalletsData || isUndefined(network)) {
            return;
        }

        return apiWalletsData.reduce((acc: WalletChainDataByWalletId, apiWallet) => {
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
    }, [apiWalletsData, network]);

    const [syncingMetatadaByAccountId, setSyncingMetatadaByAccountId] = useState<
        Partial<Record<string, SyncingMetadata>>
    >({});

    // We use refs coupled to the state to deps from the syncing loop
    const syncingMetatadaByAccountIdRef = useMirroredRef(syncingMetatadaByAccountId, {});

    const getKey = (walletId: string, walletAccountID: string) => {
        return `${walletId}-${walletAccountID}`;
    };

    const addNewSyncing = useCallback((walletId: string, walletAccountID: string) => {
        const key = getKey(walletId, walletAccountID);

        setSyncingMetatadaByAccountId((prev) => ({
            ...prev,
            [key]: {
                syncing: true,
                lastSyncing: Date.now(),
                count: (prev[key]?.count ?? 0) + 1,
            },
        }));
    }, []);

    const removeSyncing = useCallback((walletId: string, walletAccountID: string) => {
        setSyncingMetatadaByAccountId((prev) =>
            set({ ...prev }, [getKey(walletId, walletAccountID), 'syncing'], false)
        );
    }, []);

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

    const syncSingleWalletAccount = useCallback(
        async (walletId: string, accountId: string, manual = false) => {
            const wallet = initWalletsChainData?.[walletId];
            const account = wallet?.accounts[accountId];
            const metadata = syncingMetatadaByAccountIdRef.current[getKey(walletId, accountId)];

            // We enforce a cooldown between each sync
            const canSync =
                !metadata ||
                (!metadata.syncing &&
                    isBefore(metadata.lastSyncing, sub(new Date(), { seconds: SYNCING_MINIMUM_COOLDOWN_MINUTES })));

            if (wallet && account && canSync) {
                try {
                    const wasmAccount = account.account;

                    addNewSyncing(walletId, accountId);

                    // If syncing is manual, we do a full sync
                    if ((await wasmAccount.hasSyncData()) && !manual) {
                        await blockchainClient.partialSync(wasmAccount);
                    } else {
                        await blockchainClient.fullSync(wasmAccount, getDefaultStopGap() + POOL_FILLING_THRESHOLD);
                    }
                } catch (error) {
                    createNotification({ text: c('Wallet').t`An error occured`, type: 'error' });
                } finally {
                    removeSyncing(walletId, accountId);
                    onSyncingFinished?.();
                }
            }
        },

        // blockchainClient is not stable, refs are not relevant in dependencies
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [addNewSyncing, createNotification, removeSyncing, initWalletsChainData]
    );

    const syncSingleWallet = useCallback(
        async (walletId: string, manual = false) => {
            const wallet = initWalletsChainData?.[walletId];

            for (const accountId of Object.keys(wallet?.accounts ?? [])) {
                await syncSingleWalletAccount(walletId, accountId, manual);
            }
        },

        [syncSingleWalletAccount, initWalletsChainData]
    );

    const syncManyWallets = useCallback(
        async (walletIds: string[], manual = false) => {
            for (const walletId of walletIds) {
                await syncSingleWallet(walletId, manual);
            }
        },
        [syncSingleWallet]
    );

    const poll = useCallback(async () => {
        const pollingId = generateUID(POLLING_UID_PREFIX);
        pollingIdRef.current = pollingId;

        // This ensure that if another poll is start (via calling this fn), previous one will be stoped: uuid won't match anymore
        while (pollingIdRef.current == pollingId && initWalletsChainData) {
            setWalletsChainData(initWalletsChainData);
            await syncManyWallets(Object.keys(initWalletsChainData));
            await wait(10 * MINUTE);
        }
    }, [syncManyWallets, initWalletsChainData]);

    useDebounceEffect(
        () => {
            void poll();
            return () => {
                pollingIdRef.current = undefined;
            };
        },
        [poll],
        1000
    );

    // We need this reversed map to reconciliate WalletId+DerivationPath -> AccountId
    const accountIDByDerivationPathByWalletID = useMemo(() => {
        return Object.entries(walletsChainData ?? {}).reduce(
            (acc: AccountIdByDerivationPathAndWalletId, [walletId, walletChainData]) => ({
                ...acc,
                [walletId]: Object.entries(walletChainData?.accounts ?? {}).reduce(
                    (acc, [accountId, accountData]) =>
                        accountData ? { ...acc, [accountData.derivationPath]: accountId } : acc,
                    {}
                ),
            }),
            {}
        );
    }, [walletsChainData]);

    return {
        syncingMetatadaByAccountId,
        walletsChainData: walletsChainData ?? initWalletsChainData ?? {},
        accountIDByDerivationPathByWalletID,

        syncSingleWalletAccount,
        syncSingleWallet,
        syncManyWallets,

        getSyncingData,
        isSyncing,
    };
};
