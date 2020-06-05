import React from 'react';
import PropTypes from 'prop-types';
import { useSubscription, Href, useConfig } from 'react-components';
import { Link } from 'react-router-dom';

import { APPS, PLAN_SERVICES, CLIENT_TYPES } from 'proton-shared/lib/constants';
import { getPlanName, hasLifetime } from 'proton-shared/lib/helpers/subscription';

import CalendarLogo from './CalendarLogo';
import ContactsLogo from './ContactsLogo';
import DriveLogo from './DriveLogo';
import MailLogo from './MailLogo';
import VpnLogo from './VpnLogo';
import { classnames } from '../../helpers/component';

const { MAIL, VPN } = PLAN_SERVICES;
const { PROTONMAIL, PROTONCONTACTS, PROTONDRIVE, PROTONCALENDAR, PROTONVPN_SETTINGS, PROTONMAIL_SETTINGS } = APPS;

/**
 * MainLogo component
 * @type any
 * @param {String} url
 * @param {Boolean} external true for external link
 */
const MainLogo = ({ url = '/inbox', external = false, className = '' }) => {
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

MainLogo.propTypes = {
    url: PropTypes.string,
    className: PropTypes.string,
    external: PropTypes.bool
};

export default MainLogo;
