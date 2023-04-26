import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const getPassAppRoutes = () => {
    return <const>{
        header: PASS_APP_NAME,
        routes: {
            general: <SectionConfig>{
                text: c('Title').t`General`,
                to: '/general',
                icon: 'grid-2',
                subsections: [
                    {
                        text: c('Title').t`Theme`,
                        id: 'theme',
                    },
                ],
            },
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
