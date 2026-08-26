import { c } from 'ttag';

import type { SidebarConfig } from '@proton/components';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { APPS, WALLET_APP_NAME } from '@proton/shared/lib/constants';
import { WALLET_SETTINGS_ROUTES } from '@proton/wallet/constants/settings';

import type { GeneralRouterParams } from '../../content/router-params';

export const getWalletAppRoutes = ({ app }: GeneralRouterParams): SidebarConfig => {
    return {
        header: WALLET_APP_NAME,
        available: app === APPS.PROTONWALLET || app === APPS.PROTONACCOUNT,
        routes: {
            authorization: {
                id: 'authorization',
                available: false,
                text: c('wallet_signup_2024:Wallet Settings').t`Authorization`,
                to: '/authorize',
                icon: IcCheckmark,
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
                icon: IcArrowDownLine,
                subsections: [
                    {
                        id: 'downloads`',
                    },
                ],
            },
        },
    };
};
