import { c } from 'ttag';

import type { SectionConfig } from '@proton/components';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { APPS, DOCS_APP_NAME } from '@proton/shared/lib/constants';

import type { GeneralRouterParams } from '../../content/router-params';

export const getDocsAppRoutes = ({ app }: GeneralRouterParams) => {
    return <const>{
        available: app === APPS.PROTONDOCS || app === APPS.PROTONACCOUNT,
        header: DOCS_APP_NAME,
        routes: {
            comments: {
                id: 'comments',
                text: c('Title').t`Email notifications`,
                to: '/email-notifications',
                icon: IcEnvelope,
                description: c('Info').t`Manage your email notification preferences for ${DOCS_APP_NAME}.`,
                subsections: [
                    {
                        id: 'emails',
                    },
                ],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
