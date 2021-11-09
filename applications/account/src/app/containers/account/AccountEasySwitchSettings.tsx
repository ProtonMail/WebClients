import { useEffect } from 'react';
import { c } from 'ttag';

import {
    ImportListSection,
    AccountEasySwitchSection,
    SettingsPropsShared,
    useFeature,
    FeatureCode,
    useSettingsLink,
    MailImportCsvSection,
} from '@proton/components';
import { APPS, PRODUCT_NAMES } from '@proton/shared/lib/constants';

import PrivateMainAreaLoading from '../../components/PrivateMainAreaLoading';
import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getEasySwitchPage = () => {
    return {
        text: c('Title').t`Import via ${PRODUCT_NAMES.EASY_SWITCH}`,
        to: '/easy-switch',
        icon: 'arrow-down-to-screen',
        subsections: [
            {
                text: c('Title').t`Start new import`,
                id: 'start-import',
            },
            {
                text: c('Title').t`Current & past imports`,
                id: 'import-list',
            },
            {
                text: c('Title').t`Import contacts`,
                id: 'contacts-import',
            },
        ],
    };
};

const AccountEasySwitchSettings = ({ setActiveSection, location }: SettingsPropsShared) => {
    const goToSettings = useSettingsLink();
    const easySwitchFeature = useFeature(FeatureCode.EasySwitch);
    const isEasySwitchEnabled = easySwitchFeature.feature?.Value;

    useEffect(() => {
        if (!isEasySwitchEnabled && !easySwitchFeature.loading) {
            goToSettings('/import-export', APPS.PROTONMAIL);
        }
    }, [easySwitchFeature, isEasySwitchEnabled]);

    if (easySwitchFeature.loading) {
        return <PrivateMainAreaLoading />;
    }

    return isEasySwitchEnabled ? (
        <PrivateMainSettingsAreaWithPermissions
            config={getEasySwitchPage()}
            setActiveSection={setActiveSection}
            location={location}
        >
            <AccountEasySwitchSection />
            <ImportListSection />
            <MailImportCsvSection hideEasySwitch />,
        </PrivateMainSettingsAreaWithPermissions>
    ) : null;
};

export default AccountEasySwitchSettings;
