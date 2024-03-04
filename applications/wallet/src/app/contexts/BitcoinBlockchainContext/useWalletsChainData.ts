import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { chain, debounce, set } from 'lodash';
import { c } from 'ttag';

import { WasmAccount, WasmBlockchainClient, WasmPagination, WasmWallet } from '@proton/andromeda';
import { useNotifications } from '@proton/components/hooks';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import { wait } from '@proton/shared/lib/helpers/promise';

import { useBitcoinNetwork } from '../../store/hooks';
import {
    AccountChainDataByAccountId,
    AccountWithChainData,
    IWasmApiWalletData,
    WalletChainDataByWalletId,
} from '../../types';
import { tryHandleWasmError } from '../../utils/wasm/errors';

const syncAccount = async (wasmAccount: WasmAccount) => {
    const wasmChain = new WasmBlockchainClient();

    const shouldSync = await wasmChain.shouldSync(wasmAccount);

    // TODO: maybe we should remove this in favor of a cooldown timer?
    if (!shouldSync) {
        return;
    }

    return wasmAccount.hasSyncData() ? wasmChain.partialSync(wasmAccount) : wasmChain.fullSync(wasmAccount);
};

export type SyncingMetadata = { syncing: boolean; count: number; lastSyncing: number };

const useMirroredRef = <T>(state: T, init: T) => {
    const ref = useRef<T>(init);
    useEffect(() => {
        ref.current = state;
    }, [state]);

    return ref;
};

/**
 * Returns chain data given API wallets
 */
export const useWalletsChainData = (apiWalletsData?: IWasmApiWalletData[]) => {
    const [network] = useBitcoinNetwork();

    // Here undefined means there is no wallet loaded yet, it is different from {} which means that there is no wallet TO BE loaded
    const [walletsChainData, setWalletsChainData] = useState<WalletChainDataByWalletId>({});
    const [syncingMetatadaByAccountId, setSyncingMetatadaByAccountId] = useState<
        Partial<Record<string, SyncingMetadata>>
    >({});

    // We use refs coupled to the state to deps from the syncing loop
    const syncingMetatadaByAccountIdRef = useMirroredRef(syncingMetatadaByAccountId, {});
    const walletsChainDataRef = useMirroredRef(walletsChainData, {});
    const apiWalletsDataRef = useMirroredRef(apiWalletsData, []);

    const { createNotification } = useNotifications();

    const handleError = useCallback(
        (error: unknown, defaultMsg = c('Wallet').t`An error occured`) => {
            console.error(error);
            createNotification({ text: tryHandleWasmError(error) ?? defaultMsg });
        },
        [createNotification]
    );

    const getAccountData = (account: WasmAccount): AccountWithChainData => {
        const balance = account.getBalance();

        // TODO: improve pagination
        const pagination = new WasmPagination(0, 10);
        const transactions = account.getTransactions(pagination)[0];

        // TODO: add pagination on utxos
        const utxos = account.getUtxos()[0];

        return {
            account,
            balance,
            transactions,
            utxos,
        };
    };

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

    const getUpdatedAccountDataWithMaybeSync = useCallback(
        async (accountId: string, account: WasmAccount) => {
            const isAlreadySyncing = syncingMetatadaByAccountIdRef.current[accountId]?.syncing;

            if (!isAlreadySyncing) {
                addNewSyncing(accountId);

                try {
                    await syncAccount(account);
                } catch (error) {
                    handleError(error);
                }

                removeSyncing(accountId);
            }

            return getAccountData(account);
        },
        // The 3 dependencies are assumed stable at render, so `getUpdatedAccountDataWithMaybeSync` should also be
        [addNewSyncing, handleError, removeSyncing]
    );

    const syncSingleWalletAccount = useCallback(
        async (walletId: string, accountId: string) => {
            const account = walletsChainDataRef.current?.[walletId]?.accounts[accountId];

            if (account) {
                const updated = await getUpdatedAccountDataWithMaybeSync(accountId, account.account);
                setWalletsChainData((prev) => set({ ...prev }, [walletId, 'accounts', accountId], updated));
            }
        },
        [getUpdatedAccountDataWithMaybeSync]
    );

    const syncSingleWallet = useCallback(
        async (walletId: string) => {
            const wallet = walletsChainDataRef.current?.[walletId];

            for (const accountId of Object.keys(wallet?.accounts ?? [])) {
                await syncSingleWalletAccount(walletId, accountId);
            }
        },
        [syncSingleWalletAccount]
    );

    const syncManyWallets = useCallback(
        async (walletIds: string[]) => {
            for (const walletId of walletIds) {
                await syncSingleWallet(walletId);
            }
        },
        [syncSingleWallet]
    );

    const pollAccountsBlockchainData = useCallback(async () => {
        await syncManyWallets(apiWalletsDataRef.current?.map((w) => w.Wallet.ID) ?? []);
        await wait(10 * MINUTE);
        void pollAccountsBlockchainData();
    }, [syncManyWallets]);

    const debouncedPoll = useMemo(() => debounce(pollAccountsBlockchainData, 5 * SECOND), [pollAccountsBlockchainData]);

    useEffect(() => {
        void debouncedPoll();

        return () => {
            debouncedPoll.cancel();
        };
    }, [debouncedPoll]);

    const setWasmWallets = useCallback(
        (apiWallets: IWasmApiWalletData[]) => {
            if (!apiWallets || !network) {
                return;
            }

            const wasmWallets = apiWallets.reduce((acc: WalletChainDataByWalletId, apiWallet) => {
                const { Wallet, WalletAccounts } = apiWallet;

                // TODO: support watch-only wallets
                if (!Wallet.Mnemonic || (Wallet.HasPassphrase && !Wallet.Passphrase)) {
                    return acc;
                }

                const accounts = apiWallet.WalletAccounts.map((account): [number, string] => [
                    account.ScriptType,
                    account.DerivationPath,
                ]);

                const wasmWallet = new WasmWallet(network, Wallet.Mnemonic, Wallet.Passphrase ?? '', accounts);

                // Get accounts created in wasm wallet
                const wasmAccounts = WalletAccounts.reduce((acc: AccountChainDataByAccountId, account) => {
                    const wasmAccount = wasmWallet.getAccount(account.DerivationPath);
                    return wasmAccount ? { ...acc, [account.ID]: getAccountData(wasmAccount) } : acc;
                }, {});

                return {
                    ...acc,
                    [Wallet.ID]: {
                        wallet: wasmWallet,
                        accounts: wasmAccounts,
                    },
                };
            }, {});

            setWalletsChainData(wasmWallets);
        },
        [network]
    );

    useEffect(() => {
        if (apiWalletsData?.length) {
            setWasmWallets(apiWalletsData);
        }
    }, [setWasmWallets, apiWalletsData]);

    return {
        syncingMetatadaByAccountId,
        walletsChainData,
        syncSingleWalletAccount,
        syncSingleWallet,
        syncManyWallets,
    };
};
