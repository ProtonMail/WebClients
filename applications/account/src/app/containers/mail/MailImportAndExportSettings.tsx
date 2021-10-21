import { c } from 'ttag';

import {
    FeatureCode,
    ImportExportSection,
    SettingsPropsShared,
    useFeature,
    StartMailImportSection,
    MailImportListSection,
    MailImportExportSection,
    MailImportCsvSection,
    useUser,
} from '@proton/components';
import { UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getImportPage = (user: UserModel, isEasySwitchEnabled: boolean) => {
    return {
        text: c('Title').t`Import/Export`,
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
            {
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

    const importExportSection = !isEasySwitchEnabled ? (
        <MailImportExportSection key="import-export" />
    ) : (
        <ImportExportSection key="import-export" />
    );

    const sections = [
        !isEasySwitchEnabled && <StartMailImportSection key="start-import" />,
        !isEasySwitchEnabled && <MailImportListSection key="import-list" />,
        <MailImportCsvSection key="import-csv" />,
        !user.isFree && importExportSection,
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
