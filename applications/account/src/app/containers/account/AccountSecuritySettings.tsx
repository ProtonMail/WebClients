import { SessionsSection, LogsSection, SettingsPropsShared } from '@proton/components';
import { c } from 'ttag';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getSecurityPage = () => {
    return {
        text: c('Title').t`Security`,
        to: '/security',
        icon: 'security',
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
