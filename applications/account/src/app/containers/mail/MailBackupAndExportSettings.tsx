import { c } from 'ttag';

import { ImportExportAppSection, SettingsPropsShared } from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getBackupAndExportPage = () => ({
    text: c('Title').t`Backup and Export`,
    to: '/mail/backup-export',
    icon: 'arrow-down-to-screen',
    subsections: [
        {
            text: c('Title').t`Import-Export app`,
            id: 'import-export-app',
        },
    ],
});

const MailBackupAndExportSettings = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            config={getBackupAndExportPage()}
            setActiveSection={setActiveSection}
            location={location}
        >
            <ImportExportAppSection key="import-export-app" />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailBackupAndExportSettings;
