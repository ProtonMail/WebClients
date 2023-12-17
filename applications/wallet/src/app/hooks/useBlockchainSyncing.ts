import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/hooks';
import { MINUTE } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import {
    WasmAccount,
    WasmChain,
    WasmNetwork,
    WasmPagination,
    WasmSupportedBIPs,
    WasmWallet,
    WasmWalletConfig,
} from '../../pkg';
import {
    ApiWallet,
    BlockchainAccountRecord,
    BlockchainWalletRecord,
    WalletWithAccountsWithBalanceAndTxs,
} from '../types';
import { ScriptType, WalletAccount } from '../types/api';
import { tryHandleWasmError } from '../utils/wasm/errors';

const scriptTypeToBip: Record<ScriptType, WasmSupportedBIPs> = {
    [ScriptType.Legacy]: WasmSupportedBIPs.Bip44,
    [ScriptType.NestedSegwit]: WasmSupportedBIPs.Bip49,
    [ScriptType.NativeSegwit]: WasmSupportedBIPs.Bip84,
    [ScriptType.Taproot]: WasmSupportedBIPs.Bip86,
};

const syncAccount = (wasmAccount: WasmAccount) => {
    const wasmChain = new WasmChain();
    if (wasmAccount.has_sync_data()) {
        return wasmChain.partial_sync(wasmAccount);
    }

    return wasmChain.full_sync(wasmAccount);
};

export type SyncingMetadata = { syncing: boolean; count: number; lastSyncing: number };

export const useBlockchainSyncing = (wallets: ApiWallet[]) => {
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

    const getAccountData = (account: WalletAccount, wasmAccount: WasmAccount) => {
        const balance = wasmAccount.get_balance();
        const pagination = new WasmPagination(0, 10);
        const transactions = wasmAccount.get_transactions(pagination);
        const utxos = wasmAccount.get_utxos();

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

    const initAccountsBlockchainData = useCallback(() => {
        const tmpWallets: BlockchainWalletRecord = {};
        for (const wallet of wallets) {
            try {
                const tmpAccounts: BlockchainAccountRecord = {};

                const config = new WasmWalletConfig(WasmNetwork.Testnet);
                // TODO: handle passphrase wallets
                const wasmWallet = new WasmWallet(wallet.Mnemonic, '', config);

                for (const account of wallet.accounts) {
                    try {
                        void wasmWallet.add_account(scriptTypeToBip[account.ScriptType], account.Index);
                        const wasmAccount = wasmWallet.get_account(scriptTypeToBip[account.ScriptType], account.Index);

                        if (!wasmAccount) {
                            return;
                        }

                        tmpAccounts[account.WalletAccountID] = getAccountData(account, wasmAccount);
                    } catch (error) {
                        handleError(error);
                    }
                }

                tmpWallets[wallet.WalletID] = { ...wallet, accounts: { ...tmpAccounts } };
            } catch (error) {
                handleError(error);
            }
        }

        setBlockchainWalletRecord(tmpWallets);
    }, [handleError, wallets]);

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
        }, 1 * MINUTE);
    }, [syncAllWalletsBlockchainData]);

    useEffect(() => {
        initAccountsBlockchainData();
        const ts = setTimeout(() => {
            void syncAllWalletsBlockchainData(true);
        }, 1000);
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
