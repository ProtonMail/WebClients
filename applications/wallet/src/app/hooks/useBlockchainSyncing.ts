import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { WasmAccount, WasmChain, WasmNetwork, WasmPagination, WasmWallet, WasmWalletConfig } from '../../pkg';
import {
    ApiWallet,
    BlockchainAccountRecord,
    BlockchainWalletRecord,
    WalletWithAccountsWithBalanceAndTxs,
} from '../types';
import { WalletAccount } from '../types/api';
import { tryHandleWasmError } from '../utils/wasm/errors';

const syncAccount = async (wasmAccount: WasmAccount) => {
    const wasmChain = new WasmChain();
    if (await wasmAccount.hasSyncData()) {
        return wasmChain.partialSync(wasmAccount);
    }

    return wasmChain.fullSync(wasmAccount);
};

export type SyncingMetadata = { syncing: boolean; count: number; lastSyncing: number };

export const useBlockchainSyncing = (network: WasmNetwork, wallets?: ApiWallet[]) => {
    // Here undefined means there is no wallet loaded yet, it is different from {} which means that there is no wallet TO BE loaded
    const [blockchainWalletRecord, setBlockchainWalletRecord] = useState<BlockchainWalletRecord | undefined>();
    const [syncingMetatadaByAccountId, setSyncingMetatadaByAccountId] = useState<
        Partial<Record<string, SyncingMetadata>>
    >({});

    // We use refs coupled to the state to deps from the syncing loop
    const syncingMetatadaByAccountIdRef = useRef<Partial<Record<string, SyncingMetadata>>>({});
    useEffect(() => {
        syncingMetatadaByAccountIdRef.current = syncingMetatadaByAccountId;
    }, [syncingMetatadaByAccountId]);

    const blockchainWalletRecordRef = useRef<Partial<BlockchainWalletRecord | undefined>>(undefined);
    useEffect(() => {
        blockchainWalletRecordRef.current = blockchainWalletRecord;
    }, [blockchainWalletRecord]);

    const currentTimeoutId = useRef<NodeJS.Timeout>();

    const { createNotification } = useNotifications();

    const handleError = useCallback(
        (error: unknown, defaultMsg = c('Wallet').t`An error occured`) => {
            console.error(error);
            createNotification({ text: tryHandleWasmError(error) ?? defaultMsg });
        },
        [createNotification]
    );

    const getAccountData = async (account: WalletAccount, wasmAccount: WasmAccount) => {
        const balance = await wasmAccount.getBalance();
        const pagination = new WasmPagination(0, 10);
        const transactions = await wasmAccount.getTransactions(pagination);
        const utxos = await wasmAccount.getUtxos();

        return {
            ...account,
            balance,
            transactions,
            utxos,
            wasmAccount,
        };
    };

    const addNewSyncing = useCallback((walletAccountID: number) => {
        setSyncingMetatadaByAccountId((prev) => ({
            ...prev,
            [walletAccountID]: {
                ...prev[walletAccountID],
                syncing: true,
                lastSyncing: Date.now(),
                count: (prev[walletAccountID]?.count ?? 0) + 1,
            },
        }));
    }, []);

    const removeSyncing = useCallback((walletAccountID: number) => {
        setSyncingMetatadaByAccountId((prev) => ({
            ...prev,
            [walletAccountID]: {
                ...prev[walletAccountID],
                syncing: false,
            },
        }));
    }, []);

    const getUpdatedAccountDataWithMaybeSync = useCallback(
        async (account: WalletAccount, wasmAccount: WasmAccount, shouldSync = false) => {
            const isAlreadySyncing = syncingMetatadaByAccountIdRef.current[account.WalletAccountID]?.syncing;
            if (shouldSync && !isAlreadySyncing) {
                addNewSyncing(account.WalletAccountID);
                try {
                    await syncAccount(wasmAccount);
                } catch (error) {
                    handleError(error);
                }

                removeSyncing(account.WalletAccountID);
            }

            return getAccountData(account, wasmAccount);
        },
        // The 3 dependencies are assumed stable at render, so `getUpdatedAccountDataWithMaybeSync` should also be
        [addNewSyncing, handleError, removeSyncing]
    );

    const initAccountsBlockchainData = useCallback(async () => {
        if (!wallets) {
            return;
        }

        const tmpWallets: BlockchainWalletRecord = {};
        for (const wallet of wallets) {
            try {
                const tmpAccounts: BlockchainAccountRecord = {};

                const config = new WasmWalletConfig(network);
                // TODO: handle passphrase wallets
                const wasmWallet = new WasmWallet(wallet.Mnemonic, '', config);

                for (const account of wallet.accounts) {
                    try {
                        const accountKey = wasmWallet.addAccount(account.ScriptType, account.Index);
                        const wasmAccount = wasmWallet.getAccount(accountKey);

                        if (!wasmAccount) {
                            return;
                        }

                        tmpAccounts[account.WalletAccountID] = await getAccountData(account, wasmAccount);
                    } catch (error) {
                        handleError(error);
                    }
                }

                tmpWallets[wallet.WalletID] = { ...wallet, wasmWallet, accounts: { ...tmpAccounts } };
            } catch (error) {
                handleError(error);
            }
        }

        setBlockchainWalletRecord(tmpWallets);
    }, [handleError, network, wallets]);

    const syncSingleWalletAccountBlockchainData = useCallback(
        async (walletId: number, accountId: number, shouldSync = false) => {
            const account = blockchainWalletRecordRef.current?.[walletId]?.accounts[accountId];

            if (!account) {
                return;
            }

            const updated = await getUpdatedAccountDataWithMaybeSync(account, account.wasmAccount, shouldSync);

            setBlockchainWalletRecord((prev) => ({
                ...prev,
                [walletId]: {
                    ...prev?.[walletId],
                    accounts: {
                        ...prev?.[walletId]?.accounts,
                        [account.WalletAccountID]: updated,
                    },
                },
            }));
        },
        [getUpdatedAccountDataWithMaybeSync]
    );

    const syncAllWalletAccountsBlockchainData = useCallback(
        async (walletId: number, shouldSync = false) => {
            const wallet = blockchainWalletRecordRef.current?.[walletId];

            if (!wallet) {
                return;
            }

            for (const account of Object.values(wallet.accounts).filter(isTruthy)) {
                await syncSingleWalletAccountBlockchainData(walletId, account.WalletAccountID, shouldSync);
            }
        },
        [syncSingleWalletAccountBlockchainData]
    );

    const syncAllWalletsBlockchainData = useCallback(
        async (shouldSync = false) => {
            for (const wallet of Object.values(blockchainWalletRecordRef.current ?? {}).filter(isTruthy)) {
                await syncAllWalletAccountsBlockchainData(wallet.WalletID, shouldSync);
            }
        },
        [syncAllWalletAccountsBlockchainData]
    );

    const pollAccountsBlockchainData = useCallback(async () => {
        currentTimeoutId.current = setTimeout(async () => {
            await syncAllWalletsBlockchainData(true);
            void pollAccountsBlockchainData();
        }, 10 * MINUTE);
    }, [syncAllWalletsBlockchainData]);

    useEffect(() => {
        void initAccountsBlockchainData();

        const ts = setTimeout(() => {
            void syncAllWalletsBlockchainData(true);
        }, 1 * SECOND);
        return () => {
            clearTimeout(ts);
        };
    }, [initAccountsBlockchainData, syncAllWalletsBlockchainData]);

    useEffect(() => {
        void pollAccountsBlockchainData();

        return () => {
            if (currentTimeoutId.current) {
                clearTimeout(currentTimeoutId.current);
            }
        };
    }, [pollAccountsBlockchainData]);

    const walletsWithBalanceAndTxs: WalletWithAccountsWithBalanceAndTxs[] | undefined = useMemo(() => {
        if (!blockchainWalletRecord) {
            return undefined;
        }

        return Object.values(blockchainWalletRecord)
            .filter(isTruthy)
            .map((wallet) => {
                return { ...wallet, accounts: Object.values(wallet.accounts).filter(isTruthy) };
            });
    }, [blockchainWalletRecord]);

    return {
        syncingMetatadaByAccountId,
        walletsWithBalanceAndTxs,
        syncSingleWalletAccountBlockchainData,
        syncAllWalletAccountsBlockchainData,
        syncAllWalletsBlockchainData,
    };
};
