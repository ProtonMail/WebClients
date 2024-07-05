import { c } from 'ttag';

import { SidebarConfig } from '@proton/components';
import { WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { WALLET_SETTINGS_ROUTES } from '@proton/wallet';

export const getWalletAppRoutes = (): SidebarConfig => {
    return {
        header: WALLET_APP_NAME,
        routes: {
            downloads: {
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
