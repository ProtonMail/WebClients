import { useCallback, useMemo, useRef, useState } from 'react';

import { chain, set } from 'lodash';
import { c } from 'ttag';

import { WasmWallet } from '@proton/andromeda';
import generateUID from '@proton/atoms/generateUID';
import { useNotifications } from '@proton/components/hooks';
import { MINUTE } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { IWasmApiWalletData } from '@proton/wallet';

import { useBlockchainClient } from '../../hooks/useBlockchainClient';
import { useMirroredRef } from '../../hooks/useMirrorredRef';
import { useBitcoinNetwork } from '../../store/hooks';
import {
    AccountChainDataByAccountId,
    AccountIdByDerivationPathAndWalletId,
    WalletChainDataByWalletId,
} from '../../types';
import { useDebounceEffect } from '../../utils/hooks/useDebouncedEffect';
import { tryHandleWasmError } from '../../utils/wasm/errors';

export type SyncingMetadata = { syncing: boolean; count: number; lastSyncing: number };

const SYNC_UID_PREFIX = 'account-sync';
const POLLING_UID_PREFIX = 'polling';

/**
 * Returns chain data given API wallets
 */
export const useWalletsChainData = (apiWalletsData?: IWasmApiWalletData[]) => {
    const blockchainClient = useBlockchainClient();
    const pollingIdRef = useRef<string>();

    const [network] = useBitcoinNetwork();

    const [walletsChainData, setWalletsChainData] = useState<WalletChainDataByWalletId>({});

    // Data used to iterate over to sync accounts
    // Here undefined means there is no wallet loaded yet, it is different from {} which means that there is no wallet TO BE loaded
    const initWalletsChainData: WalletChainDataByWalletId | undefined = useMemo(() => {
        if (!apiWalletsData || !network) {
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
                        syncId: null,
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

    const { createNotification } = useNotifications();

    const handleError = useCallback(
        (error: unknown, defaultMsg = c('Wallet').t`An error occured`) => {
            createNotification({ text: tryHandleWasmError(error) ?? defaultMsg });
        },
        [createNotification]
    );

    const addNewSyncing = useCallback((walletAccountID: string) => {
        setSyncingMetatadaByAccountId((prev) => {
            return chain({ ...prev })
                .set([walletAccountID, 'syncing'], true)
                .set([walletAccountID, 'lastSyncing'], Date.now())
                .set([walletAccountID, 'count'], (prev[walletAccountID]?.count ?? 0) + 1)
                .value();
        });
    }, []);

    const removeSyncing = useCallback((walletAccountID: string) => {
        setSyncingMetatadaByAccountId((prev) => set({ ...prev }, [walletAccountID, 'syncing'], false));
    }, []);

    const syncSingleWalletAccount = useCallback(
        async (walletId: string, accountId: string) => {
            const wallet = initWalletsChainData?.[walletId];
            const account = wallet?.accounts[accountId];
            const isAlreadySyncing = syncingMetatadaByAccountIdRef.current[accountId]?.syncing;

            if (wallet && account && !isAlreadySyncing) {
                addNewSyncing(accountId);

                try {
                    const wasmAccount = account.account;
                    const shouldSync = await blockchainClient.shouldSync(wasmAccount);

                    // TODO: maybe we should remove this in favor of a cooldown timer?
                    if (!shouldSync) {
                        return;
                    }

                    if (await wasmAccount.hasSyncData()) {
                        await blockchainClient.partialSync(wasmAccount);
                    } else {
                        await blockchainClient.fullSync(wasmAccount);
                    }

                    const syncId = generateUID(SYNC_UID_PREFIX);
                    setWalletsChainData((prev) =>
                        set({ ...prev }, [walletId, 'accounts', accountId, 'syncId'], syncId)
                    );
                } catch (error) {
                    handleError(error);
                }

                removeSyncing(accountId);
            }
        },

        // blockchainClient is not stable, refs are not relevant in dependencies
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [addNewSyncing, handleError, removeSyncing, initWalletsChainData]
    );

    const syncSingleWallet = useCallback(
        async (walletId: string) => {
            const wallet = initWalletsChainData?.[walletId];

            for (const accountId of Object.keys(wallet?.accounts ?? [])) {
                await syncSingleWalletAccount(walletId, accountId);
            }
        },

        [syncSingleWalletAccount, initWalletsChainData]
    );

    const syncManyWallets = useCallback(
        async (walletIds: string[]) => {
            for (const walletId of walletIds) {
                await syncSingleWallet(walletId);
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
        3000
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
        walletsChainData,
        accountIDByDerivationPathByWalletID,

        syncSingleWalletAccount,
        syncSingleWallet,
        syncManyWallets,
    };
};
