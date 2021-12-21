import { useState } from 'react';
import { c } from 'ttag';
import { SettingsPropsShared, PasswordsSection, DeleteSection, useUser, UsernameSection } from '@proton/components';
import { UserModel } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const canDeleteAccount = (user: UserModel) => user.canPay && !user.isMember;

export const getAccountAndPasswordPage = ({ user }: { user: UserModel }) => {
    return {
        text: c('Title').t`Account & Password`,
        to: '/account-password',
        icon: 'user',
        permissions: [],
        subsections: [
            {
                text: c('Title').t`Username`,
                id: 'username',
            },
            {
                text: c('Title').t`Passwords`,
                id: 'passwords',
            },
            canDeleteAccount(user) && {
                text: c('Title').t`Delete account`,
                id: 'delete',
            },
        ].filter(isTruthy),
    };
};

const AccountAccountAndPasswordSettings = ({ location, setActiveSection }: SettingsPropsShared) => {
    const [user] = useUser();

    const [action] = useState(() => {
        return new URLSearchParams(location.search).get('action');
    });

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getAccountAndPasswordPage({ user })}
            setActiveSection={setActiveSection}
        >
            <UsernameSection />
            <PasswordsSection open={action === 'change-password'} />
            {canDeleteAccount(user) && <DeleteSection />}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountAccountAndPasswordSettings;
