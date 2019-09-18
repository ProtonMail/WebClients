import React from 'react';
import PropTypes from 'prop-types';
import { useSubscription, Href, useConfig } from 'react-components';
import { Link } from 'react-router-dom';

import { APPS, PLAN_SERVICES } from 'proton-shared/lib/constants';
import { getPlanName } from 'proton-shared/lib/helpers/subscription';

import CalendarLogo from './CalendarLogo';
import ContactsLogo from './ContactsLogo';
import MailLogo from './MailLogo';
import VpnLogo from './VpnLogo';

const { MAIL, VPN } = PLAN_SERVICES;
const { PROTONMAIL, PROTONCONTACTS, PROTONDRIVE, PROTONCALENDAR, PROTONVPN_SETTINGS, PROTONMAIL_SETTINGS } = APPS;

/**
 * MainLogo component
 * @param {String} url
 * @param {Boolean} external true for external link
 */
const MainLogo = ({ url = '/inbox', external = false, className = '' }) => {
    const { APP_NAME } = useConfig();
    const [subscription] = useSubscription();
    const classNames = `logo-container nodecoration flex flex-item-centered-vert ${className}`;
    const planName = getPlanName(subscription, APP_NAME === PROTONVPN_SETTINGS ? VPN : MAIL);

    const logo = (() => {
        // we do not have the proper logos for all the products yet. Use mail logo in the meantime
        if ([PROTONMAIL, PROTONMAIL_SETTINGS, PROTONDRIVE].includes(APP_NAME)) {
            return <MailLogo planName={planName} />;
        }
        if (APP_NAME === PROTONCALENDAR) {
            return <CalendarLogo planName="beta" />;
        }
        if (APP_NAME === PROTONCONTACTS) {
            return <ContactsLogo planName={planName} />;
        }
        if (APP_NAME === PROTONVPN_SETTINGS) {
            return <VpnLogo planName={planName} />;
        }
        return null;
    })();

    if (external) {
        return (
            <Href url={url} target="_self" rel="noreferrer help" className={classNames}>
                {logo}
            </Href>
        );
    }

    return (
        <Link to={url} className={classNames}>
            {logo}
        </Link>
    );
};

MainLogo.propTypes = {
    url: PropTypes.string,
    className: PropTypes.string,
    external: PropTypes.bool
};

export default MainLogo;
