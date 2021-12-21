import { c } from 'ttag';
import { SessionsSection, LogsSection, SettingsPropsShared } from '@proton/components';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getSecurityPage = () => {
    return {
        text: c('Title').t`Password & security`,
        to: '/security',
        icon: 'shield',
        subsections: [
            {
                text: c('Title').t`Session management`,
                id: 'sessions',
            },
            {
                text: c('Title').t`Security logs`,
                id: 'logs',
            },
        ],
    };
};

const AccountSecuritySettings = ({ location, setActiveSection }: SettingsPropsShared) => {
    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getSecurityPage()}
            setActiveSection={setActiveSection}
        >
            <SessionsSection />
            <LogsSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountSecuritySettings;
