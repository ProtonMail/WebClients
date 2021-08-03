import { c } from 'ttag';
import { getSlugFromApp } from '@proton/shared/lib/apps/slugHelper';
import { APPS } from '@proton/shared/lib/constants';

import { SettingsPropsShared, ThemesSection } from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const driveSlug = getSlugFromApp(APPS.PROTONDRIVE);

export const getDriveGeneralPage = () => {
    return {
        to: `/${driveSlug}/general`,
        icon: 'drive',
        text: c('Title').t`General`,
        subsections: [
            {
                text: c('Title').t`Theme`,
                id: 'theme',
            },
        ],
    };
};

const DriveGeneralSettings = ({ location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions config={getDriveGeneralPage()} location={location}>
            <ThemesSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default DriveGeneralSettings;
