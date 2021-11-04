import { SessionsSection, LogsSection, SettingsPropsShared, PasswordsSection, DeleteSection } from '@proton/components';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { UserModel } from '@proton/shared/lib/interfaces';
import { useState } from 'react';
import { c } from 'ttag';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

const canDeleteAccount = (user: UserModel) => user.canPay;

export const getPasswordAndSecurityPage = ({ user }: { user: UserModel }) => {
    return {
        text: c('Title').t`Password & security`,
        to: '/security',
        icon: 'shield',
        subsections: [
            {
                text: c('Title').t`Passwords`,
                id: 'passwords',
            },
            {
                text: c('Title').t`Session management`,
                id: 'sessions',
            },
            {
                text: c('Title').t`Security logs`,
                id: 'logs',
            },
            canDeleteAccount(user) && {
                text: c('Title').t`Delete account`,
                id: 'delete',
            },
        ].filter(isTruthy),
    };
};

interface Props extends SettingsPropsShared {
    user: UserModel;
}

const AccountPasswordAndSecuritySettings = ({ location, setActiveSection, user }: Props) => {
    const [action] = useState(() => {
        return new URLSearchParams(location.search).get('action');
    });

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getPasswordAndSecurityPage({ user })}
            setActiveSection={setActiveSection}
        >
            <PasswordsSection open={action === 'change-password'} />
            <SessionsSection />
            <LogsSection />
            {canDeleteAccount(user) && <DeleteSection />}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountPasswordAndSecuritySettings;
