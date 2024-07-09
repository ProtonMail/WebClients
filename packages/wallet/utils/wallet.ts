import { c } from 'ttag';

import type { WasmApiWallet, WasmApiWalletAccount } from '@proton/andromeda';

import { IWasmApiWalletData } from '../types';

export const buildMapFromWallets = (wallets: IWasmApiWalletData[] = []) => {
    return wallets.reduce(
        (acc, wallet) => ({
            ...acc,
            [wallet.Wallet.ID]: {
                wallet,
                accounts: wallet.WalletAccounts.reduce(
                    (acc, walletAccount) => ({ ...acc, [walletAccount.ID]: walletAccount }),
                    {}
                ),
            },
        }),
        {}
    );
};

export const getDefaultWalletName = (imported: boolean, wallets: IWasmApiWalletData[], index = 0): string => {
    const indexStr = index ? ` ${index}` : '';

    const name = imported
        ? c('wallet_signup_2024:Wallet setup').t`My imported wallet${indexStr}`
        : c('wallet_signup_2024:Wallet setup').t`My wallet${indexStr}`;

    if (wallets.some((wallet) => wallet.Wallet.Name === name)) {
        return getDefaultWalletName(imported, wallets, index + 1);
    }

    return name;
};

export const getDefaultWalletAccountName = (walletAccounts: WasmApiWalletAccount[], index = 0): string => {
    const indexStr = index.toString().padStart(2, '0');
    const label = c('wallet_signup_2024:Wallet setup').t`My wallet account ${indexStr}`;

    if (walletAccounts.some((account) => account.Label === label)) {
        return getDefaultWalletAccountName(walletAccounts, index + 1);
    }

    return label;
};

export const toWalletAccountSelectorOptions = (wallets: IWasmApiWalletData[]) =>
    wallets?.map((wallet) => [wallet.Wallet, wallet.WalletAccounts] as [WasmApiWallet, WasmApiWalletAccount[]]) ?? [];
