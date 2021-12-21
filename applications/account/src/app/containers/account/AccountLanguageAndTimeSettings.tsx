import { c } from 'ttag';
import { SettingsPropsShared, LanguageAndTimeSection } from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getLanguageAndTimePage = () => {
    return {
        text: c('Title').t`Language & Time`,
        to: '/language-time',
        icon: 'language',
        subsections: [
            {
                id: 'language-time',
            },
        ],
    };
};

const AccountLanguageAndTimeSettings = ({ location, setActiveSection }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getLanguageAndTimePage()}
            setActiveSection={setActiveSection}
        >
            <LanguageAndTimeSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountLanguageAndTimeSettings;
