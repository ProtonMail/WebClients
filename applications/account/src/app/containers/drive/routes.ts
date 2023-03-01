import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

export const getDriveAppRoutes = () => {
    return <const>{
        header: DRIVE_APP_NAME,
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
        },
    };
};
