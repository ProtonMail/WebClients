import { c } from 'ttag';

import {
    ImportListSection,
    AccountEasySwitchSection,
    SettingsPropsShared,
    useFeature,
    FeatureCode,
    useSettingsLink,
} from '@proton/components';
import { PRODUCT_NAMES } from '@proton/shared/lib/constants';

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
        ],
    };
};

const AccountEasySwitchSettings = ({ setActiveSection, location }: SettingsPropsShared) => {
    const goToSettings = useSettingsLink();
    const easySwitchFeature = useFeature(FeatureCode.EasySwitch);
    const isEasySwitchEnabled = easySwitchFeature.feature?.Value;

    if (easySwitchFeature.loading) {
        return <PrivateMainAreaLoading />;
    }

    if (!isEasySwitchEnabled) {
        goToSettings('/dashboard');
    }

    return isEasySwitchEnabled ? (
        <PrivateMainSettingsAreaWithPermissions
            config={getEasySwitchPage()}
            setActiveSection={setActiveSection}
            location={location}
        >
            <AccountEasySwitchSection />
            <ImportListSection />
        </PrivateMainSettingsAreaWithPermissions>
    ) : null;
};

export default AccountEasySwitchSettings;
