import { useCallback, useEffect, useState } from 'react';

import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';

import { WasmAccount, WasmAccountConfig, WasmNetwork, WasmPagination, WasmSupportedBIPs } from '../../pkg';
import { AccountWithBalanceAndTxs, WalletWithAccounts, WalletWithAccountsWithBalanceAndTxs } from '../types';
import { ScriptType } from '../types/api';
import { tryHandleWasmError } from '../utils/wasm/errors';

const NETWORK = WasmNetwork.Testnet;

const scriptTypeToBip: Record<ScriptType, WasmSupportedBIPs> = {
    [ScriptType.Legacy]: WasmSupportedBIPs.Bip44,
    [ScriptType.NestedSegwit]: WasmSupportedBIPs.Bip49,
    [ScriptType.NativeSegwit]: WasmSupportedBIPs.Bip84,
    [ScriptType.Taproot]: WasmSupportedBIPs.Bip86,
};

// TODO: replace by redux when ready to bootstrap it
export const useBlockchainData = (wallets: WalletWithAccounts[]) => {
    const [loading, withLoading] = useLoading();
    const [walletsWithBalanceAndTxs, setWalletsWithBalanceAndTxs] = useState<WalletWithAccountsWithBalanceAndTxs[]>([]);

    const { createNotification } = useNotifications();

    const getAccountsBlockchainData = useCallback(async () => {
        const tmpWallets: WalletWithAccountsWithBalanceAndTxs[] = [];

        for (const wallet of wallets) {
            const tmpAccounts: AccountWithBalanceAndTxs[] = [];
            for (const account of wallet.accounts) {
                try {
                    const config = new WasmAccountConfig(scriptTypeToBip[account.ScriptType], NETWORK, account.Index);

                    // TODO: handle passphrase wallets
                    const wasmAccount = new WasmAccount(wallet.Mnemonic, '', config);
                    await wasmAccount.sync();

                    const balance = wasmAccount.get_balance();

                    const pagination = new WasmPagination(0, 10);
                    const transactions = wasmAccount.get_transactions(pagination);

                    tmpAccounts.push({ ...account, balance, transactions });
                } catch (error) {
                    const errorMessage = tryHandleWasmError(error);

                    if (errorMessage) {
                        createNotification({ text: errorMessage });
                    }
                }
            }

            tmpWallets.push({ ...wallet, accounts: tmpAccounts });
        }

        setWalletsWithBalanceAndTxs(tmpWallets);
    }, [createNotification, wallets]);

    useEffect(() => {
        setWalletsWithBalanceAndTxs(wallets.map((wallet) => ({ ...wallet, accounts: [] })));

        void withLoading(() => getAccountsBlockchainData());
        // We don't want to add wallet dependency here FOR NOW
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { walletsWithBalanceAndTxs, loading };
};
