import React from 'react';
import { Link } from 'react-router-dom';

import { APPS, PLAN_SERVICES, CLIENT_TYPES } from 'proton-shared/lib/constants';
import { getPlanName, hasLifetime } from 'proton-shared/lib/helpers/subscription';

import { useSubscription, Href, useConfig } from '../../index';
import AccountLogo from './AccountLogo';
import CalendarLogo from './CalendarLogo';
import ContactsLogo from './ContactsLogo';
import DriveLogo from './DriveLogo';
import MailLogo from './MailLogo';
import VpnLogo from './VpnLogo';
import { classnames } from '../../helpers/component';

const { MAIL, VPN } = PLAN_SERVICES;
const {
    PROTONACCOUNT,
    PROTONCALENDAR,
    PROTONCONTACTS,
    PROTONDRIVE,
    PROTONMAIL,
    PROTONMAIL_SETTINGS,
    PROTONVPN_SETTINGS
} = APPS;

interface Props {
    url?: string;
    external?: boolean;
    className?: string;
}
const MainLogo = ({ url = '/inbox', external = false, className = '' }: Props) => {
    const { APP_NAME, CLIENT_TYPE } = useConfig();
    const [subscription] = useSubscription();
    const classNames = classnames(['logo-link flex nodecoration', className]);
    const planName = hasLifetime(subscription)
        ? 'Lifetime'
        : APP_NAME === PROTONCALENDAR
        ? 'beta'
        : getPlanName(subscription, CLIENT_TYPE === CLIENT_TYPES.VPN ? VPN : MAIL);

    const logo = (() => {
        // we do not have the proper logos for all the products yet. Use mail logo in the meantime
        if ([PROTONMAIL, PROTONMAIL_SETTINGS].includes(APP_NAME)) {
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

    if (external) {
        return (
            <Href
                url={url}
                target="_self"
                rel="noreferrer help"
                className={classnames([classNames, planName && `color-${planName}`, 'nodecoration'])}
            >
                {logo}
                {planName && <span className="plan uppercase bold">{planName}</span>}
            </Href>
        );
    }

    return (
        <Link to={url} className={classnames([classNames, planName && `color-${planName}`, 'nodecoration'])}>
            {logo}
            {planName && <span className="plan uppercase bold">{planName}</span>}
        </Link>
    );
};

export default MainLogo;
