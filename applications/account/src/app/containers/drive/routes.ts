import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { BRAND_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';

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
            revisions: <SectionConfig>{
                text: c('Title').t`Version history`,
                to: '/version-history',
                icon: 'clock-rotate-left',
                description: c('Info')
                    .t`To ensure you don’t lose important data, ${DRIVE_APP_NAME} saves older versions of your files as you and your collaborators make changes. Select how long ${BRAND_NAME} should keep previous versions.`,
                subsections: [
                    {
                        id: 'history',
                    },
                ],
            },
        },
    };
};
