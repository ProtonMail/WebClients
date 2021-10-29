import { c } from 'ttag';

import {
    FeatureCode,
    ImportExportSection,
    SettingsPropsShared,
    useFeature,
    StartMailImportSection,
    MailImportListSection,
    MailImportCsvSection,
    useUser,
} from '@proton/components';
import { UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getImportPage = (user: UserModel, isEasySwitchEnabled: boolean) => {
    const IAtitle = user.isFree ? c('Title').t`Import Assistant` : c('Settings section title').t`Import & export`;

    return {
        text: isEasySwitchEnabled ? c('Title').t`Backup & Export` : IAtitle,
        to: '/mail/import-export',
        icon: 'arrow-down-to-screen',
        subsections: [
            !isEasySwitchEnabled && {
                text: c('Title').t`Import Assistant`,
                id: 'start-import',
            },
            !isEasySwitchEnabled && {
                text: c('Title').t`Current & past imports`,
                id: 'import-list',
            },
            !isEasySwitchEnabled && {
                text: c('Title').t`Import contacts`,
                id: 'import-csv',
            },
            !user.isFree && {
                text: c('Title').t`Import-Export app`,
                id: 'import-export',
            },
        ].filter(isTruthy),
    };
};

const MailImportAndExportSettings = ({ setActiveSection, location }: SettingsPropsShared) => {
    const [user] = useUser();

    const isEasySwitchEnabled = useFeature(FeatureCode.EasySwitch).feature?.Value;

    const sections = [
        !isEasySwitchEnabled && <StartMailImportSection key="start-import" />,
        !isEasySwitchEnabled && <MailImportListSection key="import-list" />,
        !isEasySwitchEnabled && <MailImportCsvSection key="import-csv" />,
        !user.isFree && <ImportExportSection key="import-export" />,
    ].filter(isTruthy);

    return (
        <PrivateMainSettingsAreaWithPermissions
            config={getImportPage(user, isEasySwitchEnabled)}
            setActiveSection={setActiveSection}
            location={location}
        >
            {sections}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default MailImportAndExportSettings;
