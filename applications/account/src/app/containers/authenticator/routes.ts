import { c } from 'ttag';

import type { SectionConfig } from '@proton/components';
import { AUTHENTICATOR_APP_NAME } from '@proton/shared/lib/constants';

import type { GeneralRouterParams } from '../../content/router-params';

export const getAuthenticatorAppRoutes = ({ flags }: GeneralRouterParams) => {
    const { isAuthenticatorAvailable = false } = flags;
    return <const>{
        header: AUTHENTICATOR_APP_NAME,
        available: isAuthenticatorAvailable,
        routes: {
            downloads: {
                id: 'downloads',
                text: c('Link').t`Downloads`,
                noTitle: true,
                to: '/download',
                icon: 'arrow-down-line',
                subsections: [
                    {
                        id: 'download',
                    },
                ],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
