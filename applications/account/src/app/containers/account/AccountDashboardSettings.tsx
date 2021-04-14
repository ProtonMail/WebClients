import React from 'react';
import { c } from 'ttag';
import {
    SettingsPropsShared,
    YourPlanSection,
    EmailSubscriptionSection,
    LanguageAndTimeSection,
    CancelSubscriptionSection,
    useUser,
    PlansSection,
} from 'react-components';
import { UserModel } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import PrivateMainSettingsAreaWithPermissions from '../../components/PrivateMainSettingsAreaWithPermissions';

export const getDashboardPage = ({ user }: { user: UserModel }) => {
    const { isFree, isAdmin, canPay } = user;

    return {
        text: c('Title').t`Dashboard`,
        to: '/dashboard',
        icon: 'apps',
        subsections: [
            isFree && {
                text: c('Title').t`Select plan`,
                id: 'select-plan',
            },
            canPay && {
                text: isFree ? c('Title').t`Your current plan` : c('Title').t`Your plan`,
                id: 'your-plan',
            },
            {
                text: c('Title').t`Language & Time`,
                id: 'language-and-time',
            },
            (isFree || isAdmin) && {
                text: c('Title').t`Email subscription`,
                id: 'email-subscription',
            },
            !isFree && {
                text: c('Title').t`Cancel subscription`,
                id: 'cancel-subscription',
            },
        ].filter(isTruthy),
    };
};

const AccountDashboardSettings = ({ location, setActiveSection }: SettingsPropsShared) => {
    const [user] = useUser();

    const { isFree, isAdmin, canPay } = user;

    return (
        <PrivateMainSettingsAreaWithPermissions
            location={location}
            config={getDashboardPage({ user })}
            setActiveSection={setActiveSection}
        >
            {Boolean(isFree) && <PlansSection />}
            {Boolean(canPay) && <YourPlanSection />}
            <LanguageAndTimeSection />
            {Boolean(isFree || isAdmin) && <EmailSubscriptionSection />}
            {!isFree && <CancelSubscriptionSection />}
        </PrivateMainSettingsAreaWithPermissions>
    );
};

export default AccountDashboardSettings;
