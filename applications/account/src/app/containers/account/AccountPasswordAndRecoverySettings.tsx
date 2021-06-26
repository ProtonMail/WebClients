import React, { useState } from 'react';
import { PasswordsSection, DeleteSection, RecoveryMethodsSection, SettingsPropsShared } from 'react-components';
import { c } from 'ttag';
import { UserModel } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getPasswordAndRecoveryPage = ({ user }: { user: UserModel }) => {
    const hasRecoveryOptions = user.isPrivate;

    return {
        text: hasRecoveryOptions ? c('Title').t`Password & recovery` : c('Title').t`Password`,
        to: '/authentication',
        icon: 'keys',
        subsections: [
            {
                text: c('Title').t`Passwords`,
                id: 'passwords',
            },
            hasRecoveryOptions && {
                text: c('Title').t`Recovery & notification`,
                id: 'email',
            },
            user.canPay && {
                text: c('Title').t`Delete account`,
                id: 'delete',
            },
        ].filter(isTruthy),
    };
};

interface Props extends SettingsPropsShared {
    user: UserModel;
}

const AccountPasswordAndRecoverySettings = ({ location, setActiveSection, user }: Props) => {
    const [action] = useState(() => {
        return new URLSearchParams(location.search).get('action');
    });

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getPasswordAndRecoveryPage({ user })}
            setActiveSection={setActiveSection}
        >
            <PasswordsSection open={action === 'change-password'} />
            {user.isPrivate && <RecoveryMethodsSection />}
            {user.canPay && <DeleteSection />}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountPasswordAndRecoverySettings;
