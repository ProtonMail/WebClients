import { c } from 'ttag';
import { SectionConfig } from '@proton/components';
import { APPS, APPS_CONFIGURATION } from '@proton/shared/lib/constants';

export const getDriveAppRoutes = () => {
    return <const>{
        header: APPS_CONFIGURATION[APPS.PROTONDRIVE].name,
        routes: {
            general: <SectionConfig>{
                text: c('Title').t`General`,
                to: '/general',
                icon: 'grid',
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
