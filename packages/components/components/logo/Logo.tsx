import React from 'react';

import { APP_NAMES, APPS, PLAN_SERVICES } from '@proton/shared/lib/constants';
import { getPlanName, hasLifetime } from '@proton/shared/lib/helpers/subscription';
import { Subscription } from '@proton/shared/lib/interfaces';

import { useSubscription } from '../../hooks';
import AccountLogo from './AccountLogo';
import CalendarLogo from './CalendarLogo';
import ContactsLogo from './ContactsLogo';
import DriveLogo from './DriveLogo';
import MailLogo from './MailLogo';
import VpnLogo from './VpnLogo';
import { classnames } from '../../helpers';
import AppLink, { Props as AppLinkProps } from '../link/AppLink';

const { MAIL, VPN } = PLAN_SERVICES;
const { PROTONACCOUNT, PROTONCALENDAR, PROTONCONTACTS, PROTONDRIVE, PROTONMAIL, PROTONVPN_SETTINGS } = APPS;

const getLogoText = (subscription: Subscription, APP_NAME: APP_NAMES) => {
    if (subscription) {
        if (hasLifetime(subscription)) {
            return 'Lifetime';
        }
        return getPlanName(subscription, APP_NAME === PROTONVPN_SETTINGS ? VPN : MAIL);
    }
};

export interface LogoProps extends AppLinkProps {
    appName: APP_NAMES;
}

const Logo = ({ appName, className, ...rest }: LogoProps) => {
    const [subscription] = useSubscription();
    const classNames = classnames(['logo-link flex text-no-decoration', className]);
    const planName = getLogoText(subscription, appName);

    const logo = (() => {
        if (appName === PROTONMAIL) {
            return <MailLogo />;
        }
        if (appName === PROTONCALENDAR) {
            return <CalendarLogo />;
        }
        if (appName === PROTONCONTACTS) {
            return <ContactsLogo />;
        }
        if (appName === PROTONVPN_SETTINGS) {
            return <VpnLogo />;
        }
        if (appName === PROTONDRIVE) {
            return <DriveLogo />;
        }
        if (appName === PROTONACCOUNT) {
            return <AccountLogo />;
        }
        return null;
    })();

    return (
        <AppLink {...rest} className={classnames([classNames, planName && `color-${planName}`, 'text-no-decoration'])}>
            {logo}
            {planName && <span className="plan text-uppercase text-bold">{planName}</span>}
        </AppLink>
    );
};

export default Logo;
