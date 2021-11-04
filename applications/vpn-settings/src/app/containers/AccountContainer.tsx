import { useState } from 'react';
import {
    AccountRecoverySection,
    UsernameSection,
    PasswordsSection,
    EmailSubscriptionSection,
    DeleteSection,
    OpenVPNCredentialsSection,
    SettingsPropsShared,
} from '@proton/components';
import { c } from 'ttag';

import PrivateMainSettingsAreaWithPermissions from '../components/page/PrivateMainSettingsAreaWithPermissions';

export const getAccountPage = () => {
    return {
        text: c('Title').t`Account`,
        to: '/account',
        icon: 'circle-user',
        subsections: [
            {
                text: c('Title').t`Username`,
                id: 'username',
            },
            {
                text: c('Title').t`Passwords`,
                id: 'passwords',
            },
            {
                text: c('Title').t`OpenVPN / IKEv2 username`,
                id: 'openvpn',
            },
            {
                text: c('Title').t`Recovery`,
                id: 'email',
            },
            {
                text: c('Title').t`Email subscriptions`,
                id: 'news',
            },
            {
                text: c('Title').t`Delete`,
                id: 'delete',
            },
        ],
    };
};

const AccountContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    const [action] = useState(() => {
        return new URLSearchParams(location.search).get('action');
    });

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getAccountPage()}
            setActiveSection={setActiveSection}
        >
            <UsernameSection />
            <PasswordsSection open={action === 'change-password'} />
            <OpenVPNCredentialsSection />
            <AccountRecoverySection />
            <EmailSubscriptionSection />
            <DeleteSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountContainer;
