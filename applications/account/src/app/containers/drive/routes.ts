import { c } from 'ttag';

import type { SectionConfig } from '@proton/components';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, DRIVE_APP_NAME } from '@proton/shared/lib/constants';

export const getDriveAppRoutes = ({
    app,
    isB2BDrive,
    canB2BHidePhotos,
}: {
    app: APP_NAMES;
    isB2BDrive: boolean;
    canB2BHidePhotos: boolean;
}) => {
    return <const>{
        available: app === APPS.PROTONDRIVE,
        header: DRIVE_APP_NAME,
        routes: {
            revisions: {
                id: 'revisions',
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
            photos: {
                id: 'photos',
                available: isB2BDrive && canB2BHidePhotos,
                text: c('Title').t`Photos`,
                to: '/photos',
                icon: 'image',
                description: c('Info').t`You can enable the Photos section from the interface using the toggle below.`,
                subsections: [
                    {
                        id: 'photos',
                    },
                ],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
