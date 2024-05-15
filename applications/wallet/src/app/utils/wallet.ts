import { c } from 'ttag';

import { WasmApiWalletAccount } from '@proton/andromeda';
import { IWasmApiWalletData } from '@proton/wallet';

export const getDefaultWalletName = (imported: boolean, wallets: IWasmApiWalletData[], index = 0): string => {
    const indexStr = index.toString().padStart(2, '0');

    const name = imported
        ? c('Wallet setup').t`My imported wallet ${indexStr}`
        : c('Wallet setup').t`My wallet ${indexStr}`;

    if (wallets.some((wallet) => wallet.Wallet.Name === name)) {
        return getDefaultWalletName(imported, wallets, index + 1);
    }

    return name;
};

export const getDefaultWalletAccountName = (walletAccounts: WasmApiWalletAccount[], index = 0): string => {
    const indexStr = index.toString().padStart(2, '0');
    const label = c('Wallet setup').t`My wallet account ${indexStr}`;

    if (walletAccounts.some((account) => account.Label === label)) {
        return getDefaultWalletAccountName(walletAccounts, index + 1);
    }

    return label;
};
