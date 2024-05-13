import { WalletClient, WalletClientKeys } from './types';

export const WALLET_SETTINGS_ROUTES = {
    DOWNLOADS: '/downloads',
};

export const WALLET_CLIENTS: { [key in WalletClientKeys]: WalletClient } = {
    [WalletClientKeys.Windows]: {
        title: 'Windows',
        link: 'https://proton.me/download/tbd',
        icon: 'brand-windows',
    },
    [WalletClientKeys.macOS]: {
        title: 'MacOS',
        link: 'https://proton.me/download/tbd',
        icon: 'brand-mac',
    },
    [WalletClientKeys.Android]: {
        title: 'Android',
        link: 'https://play.google.com/tbd',
        icon: 'brand-android',
    },
    [WalletClientKeys.iOS]: {
        title: 'iOS',
        link: 'https://apps.apple.com/tbd',
        icon: 'brand-apple',
    },
} as const;
