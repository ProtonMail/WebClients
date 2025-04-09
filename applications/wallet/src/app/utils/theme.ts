import type { IWasmApiWalletData } from '@proton/wallet';

/**
 * sub-theme is used to distinguish user's wallets
 */
export enum SubTheme {
    ORANGE = 'ui-orange',
    BLUE = 'ui-blue',
    PINK = 'ui-pink',
    GREEN = 'ui-green',
    PURPLE = 'ui-purple',
}

export enum WalletUpgradeBanner {
    LOCK = 'lock',
    AT_SIGN = 'at-sign',
}

const subthemes = new Set([SubTheme.ORANGE, SubTheme.BLUE, SubTheme.PURPLE, SubTheme.GREEN, SubTheme.PINK]);

export const getThemeByIndex = (index: number) => {
    const t = Array.from(subthemes);
    return t[Math.max(index, 0) % t.length];
};

export const getThemeForWallet = (wallets: IWasmApiWalletData[] = [], walletId?: string) => {
    return getThemeByIndex(wallets.findIndex((w) => w.Wallet.ID === walletId));
};
