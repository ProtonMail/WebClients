import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { APPS, APP_NAMES, PASS_APP_NAME } from '@proton/shared/lib/constants';

export const getPassAppRoutes = ({ app }: { app: APP_NAMES }) => {
    return <const>{
        available: app === APPS.PROTONPASS,
        header: PASS_APP_NAME,
        routes: {
            downloads: <SectionConfig>{
                text: c('Link').t`Apps and extensions`,
                to: '/download',
                icon: 'arrow-down-line',
                subsections: [
                    {
                        id: 'download`',
                    },
                ],
            },
        },
    };
};
