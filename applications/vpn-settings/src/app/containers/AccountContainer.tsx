import { useState } from 'react';
import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { UserModel } from '@proton/shared/lib/interfaces';
import {
    AccountRecoverySection,
    UsernameSection,
    PasswordsSection,
    EmailSubscriptionSection,
    DeleteSection,
    OpenVPNCredentialsSection,
    SettingsPropsShared,
    useUser,
} from '@proton/components';
import PrivateMainSettingsAreaWithPermissions from '../components/page/PrivateMainSettingsAreaWithPermissions';

const canDeleteAccount = (user: UserModel) => user.canPay && !user.isMember;

export const getAccountPage = (user: UserModel) => {
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
            !user.isMember && {
                text: c('Title').t`Email subscriptions`,
                id: 'news',
            },
            canDeleteAccount(user) && {
                text: c('Title').t`Delete`,
                id: 'delete',
            },
        ].filter(isTruthy),
    };
};

const AccountContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    const [action] = useState(() => {
        return new URLSearchParams(location.search).get('action');
    });
    const [user] = useUser();

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getAccountPage(user)}
            setActiveSection={setActiveSection}
        >
            <UsernameSection />
            <PasswordsSection open={action === 'change-password'} />
            <OpenVPNCredentialsSection />
            <AccountRecoverySection />
            {!user.isMember && <EmailSubscriptionSection />}
            {canDeleteAccount(user) && <DeleteSection />}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountContainer;
