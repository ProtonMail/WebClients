import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const getPassAppRoutes = () => {
    return <const>{
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
