import React from 'react';
import PropTypes from 'prop-types';
import { useSubscription, Href, useConfig } from 'react-components';
import { Link } from 'react-router-dom';

import { formatPlans } from '../../containers/payments/subscription/helpers';
import { APPS } from 'proton-shared/lib/constants';

import MailLogo from './MailLogo';
import VpnLogo from './VpnLogo';

const { PROTONMAIL, PROTONCONTACTS, PROTONDRIVE, PROTONCALENDAR, PROTONVPN_SETTINGS, PROTONMAIL_SETTINGS } = APPS;

/**
 * MainLogo component
 * @param {String} url
 * @param {Boolean} external true for external link
 */
const MainLogo = ({ url = '/inbox', external = false }) => {
    const { APP_NAME } = useConfig();
    const [{ Plans } = {}] = useSubscription();
    const className = 'logo-container nodecoration flex-item-centered-vert';

    const { mailPlan = {}, vpnPlan = {} } = formatPlans(Plans);

    const logo = (() => {
        // we do not have the proper logos for all the products yet. Use mail logo in the meantime
        if ([PROTONMAIL, PROTONMAIL_SETTINGS, PROTONCONTACTS, PROTONDRIVE, PROTONCALENDAR].includes(APP_NAME)) {
            return <MailLogo planName={mailPlan.Name} />;
        }
        if (APP_NAME === PROTONVPN_SETTINGS) {
            return <VpnLogo planName={vpnPlan.Name} />;
        }
        return null;
    })();

    if (external) {
        return (
            <Href url={url} rel="noreferrer help" className={className}>
                {logo}
            </Href>
        );
    }

    return (
        <Link to={url} className={className}>
            {logo}
        </Link>
    );
};

MainLogo.propTypes = {
    url: PropTypes.string,
    external: PropTypes.bool
};

export default MainLogo;
