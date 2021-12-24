import { c } from 'ttag';

import { ImportListSection, AccountEasySwitchSection, SettingsPropsShared } from '@proton/components';
import { PRODUCT_NAMES } from '@proton/shared/lib/constants';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getEasySwitchPage = () => {
    return {
        text: c('Title').t`Import via ${PRODUCT_NAMES.EASY_SWITCH}`,
        to: '/easy-switch',
        icon: 'arrow-down-to-screen',
        description: c('Settings description').t`Make the move to privacy. Effortlessly and securely.`,
        subsections: [
            {
                text: c('Title').t`Start new import`,
                id: 'start-import',
            },
            {
                text: c('Title').t`Current and past imports`,
                id: 'import-list',
            },
        ],
    };
};

const AccountEasySwitchSettings = ({ setActiveSection, location }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            config={getEasySwitchPage()}
            setActiveSection={setActiveSection}
            location={location}
        >
            <AccountEasySwitchSection />
            <ImportListSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountEasySwitchSettings;
