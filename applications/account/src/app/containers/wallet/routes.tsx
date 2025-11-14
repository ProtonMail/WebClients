import { c } from 'ttag';

import type { SidebarConfig } from '@proton/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { WALLET_SETTINGS_ROUTES } from '@proton/wallet';

export const getWalletAppRoutes = (): SidebarConfig => {
    return {
        header: WALLET_APP_NAME,
        routes: {
            authorization: {
                id: 'authorization',
                available: false,
                text: c('wallet_signup_2024:Wallet Settings').t`Authorization`,
                to: '/authorize',
                icon: 'checkmark',
                subsections: [
                    {
                        id: 'activate`',
                    },
                ],
            },
            downloads: {
                id: 'downloads',
                text: c('wallet_signup_2024:Wallet Settings').t`Downloads`,
                to: WALLET_SETTINGS_ROUTES.DOWNLOADS,
                icon: 'arrow-down-line',
                subsections: [
                    {
                        id: 'downloads`',
                    },
                ],
            },
        },
    };
};
