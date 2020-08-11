import React from 'react';

import { APPS, PLAN_SERVICES } from 'proton-shared/lib/constants';
import { getPlanName, hasLifetime } from 'proton-shared/lib/helpers/subscription';

import { useSubscription, useConfig } from '../../index';
import AccountLogo from './AccountLogo';
import CalendarLogo from './CalendarLogo';
import ContactsLogo from './ContactsLogo';
import DriveLogo from './DriveLogo';
import MailLogo from './MailLogo';
import VpnLogo from './VpnLogo';
import { classnames } from '../../helpers/component';
import AppLink, { Props as AppLinkProps } from '../link/AppLink';

const { MAIL, VPN } = PLAN_SERVICES;
const {
    PROTONACCOUNT,
    PROTONCALENDAR,
    PROTONCONTACTS,
    PROTONDRIVE,
    PROTONMAIL,
    PROTONMAIL_SETTINGS,
    PROTONVPN_SETTINGS,
} = APPS;

const MainLogo = ({ className = '', ...rest }: AppLinkProps) => {
    const { APP_NAME } = useConfig();
    const [subscription] = useSubscription();
    const classNames = classnames(['logo-link flex nodecoration', className]);
    const planName = hasLifetime(subscription)
        ? 'Lifetime'
        : APP_NAME === PROTONCALENDAR
        ? 'beta'
        : getPlanName(subscription, APP_NAME === PROTONVPN_SETTINGS ? VPN : MAIL);

    const logo = (() => {
        if (APP_NAME === PROTONMAIL || APP_NAME === PROTONMAIL_SETTINGS) {
            return <MailLogo />;
        }
        if (APP_NAME === PROTONCALENDAR) {
            return <CalendarLogo />;
        }
        if (APP_NAME === PROTONCONTACTS) {
            return <ContactsLogo />;
        }
        if (APP_NAME === PROTONVPN_SETTINGS) {
            return <VpnLogo />;
        }
        if (APP_NAME === PROTONDRIVE) {
            return <DriveLogo />;
        }
        if (APP_NAME === PROTONACCOUNT) {
            return <AccountLogo />;
        }
        return null;
    })();

    return (
        <AppLink {...rest} className={classnames([classNames, planName && `color-${planName}`, 'nodecoration'])}>
            {logo}
            {planName && <span className="plan uppercase bold">{planName}</span>}
        </AppLink>
    );
};

export default MainLogo;
