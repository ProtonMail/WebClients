import { type WalletClient, WalletClientKeys } from '../types';

export const WALLET_SETTINGS_ROUTES = {
    DOWNLOADS: '/downloads',
};

export const WALLET_CLIENTS: { [key in WalletClientKeys]: WalletClient } = {
    [WalletClientKeys.Android]: {
        title: 'Android',
        icon: 'brand-android',
    },
    [WalletClientKeys.iOS]: {
        title: 'iOS',
        icon: 'brand-apple',
        link: 'https://testflight.apple.com/join/6OIcXtQN',
    },
} as const;
