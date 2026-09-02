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
        link: 'https://play.google.com/store/apps/details?id=me.proton.wallet.android&referrer=utm_source\%3Dproton.me\%26utm_medium\%3Dweb\%26utm_campaign\%3Dwa_set_btn',
        items: androidLinks,
    },
    [WalletClientKeys.iOS]: {
        title: 'iOS',
        icon: 'brand-apple',
        link: 'https://apps.apple.com/app/apple-store/id6479609548?pt=106513916&ct=wa_set_btn&mt=8',
    },
} as const;

export const MAX_RECIPIENTS_PER_TRANSACTIONS = 10;
