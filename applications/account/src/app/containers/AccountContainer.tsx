import React, { useState } from 'react';
import {
    UsernameSection,
    PasswordsSection,
    NewsSection,
    DeleteSection,
    RecoveryMethodsSection,
    TwoFactorSection,
    SettingsPropsShared,
} from 'react-components';
import { c } from 'ttag';
import { UserModel } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../components/PrivateMainSettingsAreaWithPermissions';

export const getAccountPage = (user: UserModel) => {
    return {
        text: c('Title').t`Account`,
        to: '/account',
        icon: 'account',
        subsections: [
            {
                text: user.Name ? c('Title').t`Username` : c('Title').t`Email`,
                id: 'username',
            },
            {
                text: c('Title').t`Passwords`,
                id: 'passwords',
            },
            {
                text: c('Title').t`Two factor authentication`,
                id: 'two-fa',
            },
            {
                text: c('Title').t`Recovery & notification`,
                id: 'email',
            },
            user.canPay && {
                text: c('Title').t`Email subscriptions`,
                id: 'news',
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

const AccountContainer = ({ location, setActiveSection, user }: Props) => {
    const [action] = useState(() => {
        return new URLSearchParams(location.search).get('action');
    });

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getAccountPage(user)}
            setActiveSection={setActiveSection}
        >
            <UsernameSection />
            <PasswordsSection open={action === 'change-password'} />
            <TwoFactorSection />
            <RecoveryMethodsSection />
            <NewsSection />
            <DeleteSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountContainer;
