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
    BlockchainAccountRecord,
    BlockchainWalletRecord,
    WalletWithAccounts,
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

export const useBlockchainSyncing = (wallets: WalletWithAccounts[]) => {
    // Here null means there is no wallet loaded yet, it is different from {} which means that there is no wallet TO BE loaded
    const [blockchainWalletRecord, setBlockchainWalletRecord] = useState<BlockchainWalletRecord | null>(null);
    const [syncingAccounts, setSyncingAccounts] = useState<Partial<Record<string, boolean>>>({});
    const currentTimeoutId = useRef<NodeJS.Timeout>();

    const { createNotification } = useNotifications();

    const handleError = useCallback(
        (error: unknown, defaultMsg = c('Wallet').t`An error occured`) => {
            console.error(error);
            createNotification({ text: tryHandleWasmError(error) ?? defaultMsg });
        },
        [createNotification]
    );

    const iterateOverAccounts = useCallback(
        async <TAccount>(accounts: TAccount[], accountCallback: (account: TAccount) => Promise<void> | void) => {
            for (const account of accounts) {
                try {
                    await accountCallback(account);
                } catch (error) {
                    handleError(error);
                }
            }
        },
        [handleError]
    );

    const iterateOverWallets = useCallback(
        async <TWallet>(wallets: TWallet[], walletCallback: (wallet: TWallet) => Promise<void> | void) => {
            for (const wallet of wallets) {
                try {
                    await walletCallback(wallet);
                } catch (error) {
                    handleError(error);
                }
            }
        },
        [handleError]
    );

    const getUpdatedAccountData = (account: WalletAccount, wasmAccount: WasmAccount) => {
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

    const getUpdatedAccountDataWithMaybeSync = useCallback(
        async (account: WalletAccount, wasmAccount: WasmAccount, shouldSync = false) => {
            if (shouldSync && !syncingAccounts[account.WalletAccountID]) {
                setSyncingAccounts((prev) => ({ ...prev, [account.WalletAccountID]: true }));
                await syncAccount(wasmAccount);
                setSyncingAccounts((prev) => ({ ...prev, [account.WalletAccountID]: false }));
            }

            return getUpdatedAccountData(account, wasmAccount);
        },
        [syncingAccounts]
    );

    const initAccountsBlockchainData = useCallback(async () => {
        const tmpWallets: BlockchainWalletRecord = {};
        await iterateOverWallets(wallets, async (wallet) => {
            const tmpAccounts: BlockchainAccountRecord = {};

            const config = new WasmWalletConfig(WasmNetwork.Testnet);
            // TODO: handle passphrase wallets
            const wasmWallet = new WasmWallet(wallet.Mnemonic, '', config);

            await iterateOverAccounts(wallet.accounts, (account) => {
                void wasmWallet.add_account(scriptTypeToBip[account.ScriptType], account.Index);
                const wasmAccount = wasmWallet.get_account(scriptTypeToBip[account.ScriptType], account.Index);

                if (!wasmAccount) {
                    return;
                }

                tmpAccounts[account.WalletAccountID] = getUpdatedAccountData(account, wasmAccount);
            });

            tmpWallets[wallet.WalletID] = { ...wallet, accounts: { ...tmpAccounts } };
        });
    }, [iterateOverAccounts, iterateOverWallets, wallets]);

    const syncSingleWalletAccountBlockchainData = useCallback(
        async (walletId: string, accountId: string, shouldSync = false) => {
            const wallet = blockchainWalletRecord?.[walletId];
            const account = wallet?.accounts[accountId];

            if (!account) {
                return;
            }

            const updated = await getUpdatedAccountDataWithMaybeSync(account, account.wasmAccount, shouldSync);

            setBlockchainWalletRecord((prev) => ({
                ...prev,
                [wallet.WalletID]: {
                    ...wallet,
                    accounts: {
                        ...wallet,
                        [account.WalletAccountID]: updated,
                    },
                },
            }));
        },
        [blockchainWalletRecord, getUpdatedAccountDataWithMaybeSync]
    );

    const syncAllWalletAccountsBlockchainData = useCallback(
        async (walletId: string, shouldSync = false) => {
            const wallet = blockchainWalletRecord?.[walletId];

            if (!wallet) {
                return;
            }

            const tmpAccounts: BlockchainAccountRecord = {};

            const bcAccounts = Object.values(wallet.accounts).filter(isTruthy);
            await iterateOverAccounts(bcAccounts, async (account) => {
                tmpAccounts[account.WalletAccountID] = await getUpdatedAccountDataWithMaybeSync(
                    account,
                    account.wasmAccount,
                    shouldSync
                );
            });

            setBlockchainWalletRecord((prev) => ({
                ...prev,
                [wallet.WalletID]: { ...wallet, accounts: { ...tmpAccounts } },
            }));
        },
        [blockchainWalletRecord, getUpdatedAccountDataWithMaybeSync, iterateOverAccounts]
    );

    const syncAllWalletsBlockchainData = useCallback(
        async (shouldSync = false) => {
            const tmpWallets: BlockchainWalletRecord = {};
            const bcWallets = Object.values(blockchainWalletRecord ?? {}).filter(isTruthy);
            await iterateOverWallets(bcWallets, async (wallet) => {
                const tmpAccounts: BlockchainAccountRecord = {};

                const bcAccounts = Object.values(wallet.accounts).filter(isTruthy);
                await iterateOverAccounts(bcAccounts, async (account) => {
                    tmpAccounts[account.WalletAccountID] = await getUpdatedAccountDataWithMaybeSync(
                        account,
                        account.wasmAccount,
                        shouldSync
                    );
                });

                tmpWallets[wallet.WalletID] = { ...wallet, accounts: { ...tmpAccounts } };
            });

            setBlockchainWalletRecord(tmpWallets);
        },
        [blockchainWalletRecord, getUpdatedAccountDataWithMaybeSync, iterateOverAccounts, iterateOverWallets]
    );

    const pollAccountsBlockchainData = useCallback(async () => {
        currentTimeoutId.current = setTimeout(async () => {
            await syncAllWalletsBlockchainData(true);
            void pollAccountsBlockchainData();
        }, 5 * MINUTE);
    }, [syncAllWalletsBlockchainData]);

    useEffect(() => {
        void initAccountsBlockchainData();
    }, [initAccountsBlockchainData]);

    useEffect(() => {
        void pollAccountsBlockchainData();

        return () => {
            if (currentTimeoutId.current) {
                clearTimeout(currentTimeoutId.current);
            }
        };
    }, [pollAccountsBlockchainData]);

    const walletsWithBalanceAndTxs: WalletWithAccountsWithBalanceAndTxs[] | null = useMemo(() => {
        if (!blockchainWalletRecord) {
            return null;
        }

        return Object.values(blockchainWalletRecord)
            .filter(isTruthy)
            .map((wallet) => {
                return { ...wallet, accounts: Object.values(wallet.accounts).filter(isTruthy) };
            });
    }, [blockchainWalletRecord]);

    return {
        syncingAccounts,
        walletsWithBalanceAndTxs,
        syncSingleWalletAccountBlockchainData,
        syncAllWalletAccountsBlockchainData,
        syncAllWalletsBlockchainData,
    };
};
