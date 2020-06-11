import React from 'react';
import { PlansSection, SubscriptionSection, BillingSection, useUser, SettingsPropsShared } from 'react-components';
import { PERMISSIONS } from 'proton-shared/lib/constants';
import { UserModel } from 'proton-shared/lib/interfaces';
import { c } from 'ttag';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../components/page/PrivateMainSettingsAreaWithPermissions';

const { UPGRADER, PAID } = PERMISSIONS;

export const getDashboardPage = (user: UserModel) => {
    return {
        text: c('Title').t`Dashboard`,
        link: '/dashboard',
        icon: 'dashboard',
        permissions: [UPGRADER],
        subsections: [
            !user.hasPaidVpn && {
                text: c('Title').t`Plans`,
                id: 'plans'
            },
            {
                text: c('Title').t`Subscription`,
                id: 'subscription',
                permissions: [PAID]
            },
            {
                text: c('Title').t`Billing`,
                id: 'billing',
                permissions: [PAID]
            }
        ].filter(isTruthy)
    };
};

const DashboardContainer = ({ setActiveSection, location }: SettingsPropsShared) => {
    const [user] = useUser();

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getDashboardPage(user)}
            setActiveSection={setActiveSection}
        >
            {!user.hasPaidVpn ? <PlansSection /> : null}
            <SubscriptionSection />
            <BillingSection />
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default DashboardContainer;
