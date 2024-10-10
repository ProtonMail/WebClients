import { type WalletClient, WalletClientKeys } from '../types';

export const WALLET_SETTINGS_ROUTES = {
    DOWNLOADS: '/downloads',
};

export const WALLET_CLIENTS: { [key in WalletClientKeys]: WalletClient } = {
    [WalletClientKeys.Android]: {
        title: 'Android',
        icon: 'brand-android',
        link: 'https://play.google.com/store/apps/details?id=me.proton.wallet.android',
    },
    [WalletClientKeys.iOS]: {
        title: 'iOS',
        icon: 'brand-apple',
        link: 'https://testflight.apple.com/join/6OIcXtQN',
    },
} as const;

export const MAX_RECIPIENTS_PER_TRANSACTIONS = 10;
