import { c } from 'ttag';

import { SidebarConfig } from '@proton/components';
import { BRAND_NAME, WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { WALLET_SETTINGS_ROUTE, WALLET_SETTINGS_SECTION_ID } from '@proton/shared/lib/wallet';

export const getWalletAppRoutes = (): SidebarConfig => {
    return {
        header: WALLET_APP_NAME,
        routes: {
            general: {
                text: c('Wallet Settings').t`General`,
                description: c('Wallet Settings')
                    .t`Adjust your Bitcoin wallet preferences with ease. Customize security, notifications, and other settings to tailor your experience to your liking.`,
                to: WALLET_SETTINGS_ROUTE.GENERAL,
                icon: 'cog-wheel',
                subsections: [
                    {
                        text: c('Title').t`Appearance`,
                        id: WALLET_SETTINGS_SECTION_ID.APPEARANCE,
                    },
                ],
            },
            security: {
                text: c('Wallet Settings').t`Security and Privacy`,
                description: c('Wallet Settings')
                    .t`Enforce rock solid security to your ${BRAND_NAME} wallets and ensure state-of-the-art privacy when transacting with bitcoins.`,
                to: WALLET_SETTINGS_ROUTE.SECURITY,
                icon: 'lock',
                subsections: [
                    {
                        text: c('Title').t`Security`,
                        id: WALLET_SETTINGS_SECTION_ID.SECURITY,
                    },
                    {
                        text: c('Title').t`Privacy`,
                        id: WALLET_SETTINGS_SECTION_ID.PRIVACY,
                    },
                ],
            },
            wallets: {
                text: c('Wallet Settings').t`Wallets`,
                description: c('Wallet Settings')
                    .t`Effortlessly manage your wallets in this section. Add, remove, or organize your Bitcoin wallets for a seamless and personalized experience.`,
                to: WALLET_SETTINGS_ROUTE.WALLETS,
                icon: 'wallet',
                subsections: [
                    {
                        text: c('Title').t`My Wallets`,
                        id: WALLET_SETTINGS_SECTION_ID.MY_WALLETS,
                    },
                ],
            },
            wallet: {
                text: c('Wallet Settings').t`Wallet`,
                to: WALLET_SETTINGS_ROUTE.WALLET,
                icon: 'wallet',
                subsections: [
                    {
                        text: c('Title').t`Accounts`,
                        id: WALLET_SETTINGS_SECTION_ID.ACCOUNTS,
                    },
                    {
                        text: c('Title').t`Addresses`,
                        id: WALLET_SETTINGS_SECTION_ID.ADDRESSES,
                    },
                    {
                        text: c('Title').t`Invoices`,
                        id: WALLET_SETTINGS_SECTION_ID.INVOICES,
                    },
                    {
                        text: c('Title').t`Channels`,
                        id: WALLET_SETTINGS_SECTION_ID.CHANNELS,
                    },
                ],
            },
        },
    };
};
