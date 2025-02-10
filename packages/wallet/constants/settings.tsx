import DropdownMenuLink from '@proton/components/components/dropdown/DropdownMenuLink';

import { type WalletClient, WalletClientKeys } from '../types';

const androidLinks = [
    {
        href: 'https://proton.me/download/WalletAndroid/ProtonWallet-Android.apk',
        children: 'APK',
    },
].map(({ href, children }) => {
    return (
        <div className="flex items-center overflow-hidden" key={children}>
            <DropdownMenuLink className="flex-1" href={href}>
                {children}
            </DropdownMenuLink>
        </div>
    );
});

export const WALLET_SETTINGS_ROUTES = {
    DOWNLOADS: '/downloads',
};

export const WALLET_CLIENTS: { [key in WalletClientKeys]: WalletClient } = {
    [WalletClientKeys.Android]: {
        title: 'Android',
        icon: 'brand-android',
        link: 'https://play.google.com/store/apps/details?id=me.proton.wallet.android',
        items: androidLinks,
    },
    [WalletClientKeys.iOS]: {
        title: 'iOS',
        icon: 'brand-apple',
        link: 'https://apps.apple.com/app/proton-wallet-secure-btc/id6479609548',
    },
} as const;

export const MAX_RECIPIENTS_PER_TRANSACTIONS = 10;
