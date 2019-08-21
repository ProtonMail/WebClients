import React from 'react';
import PropTypes from 'prop-types';
import { useSubscription, Href, useConfig } from 'react-components';

import { formatPlans } from '../../containers/payments/subscription/helpers';
import { APPS } from 'proton-shared/lib/constants';

import MailLogo from './MailLogo';
import VpnLogo from './VpnLogo';

const { PROTONMAIL, PROTONCONTACTS, PROTONDRIVE, PROTONCALENDAR, PROTONVPN_SETTINGS, PROTONMAIL_SETTINGS } = APPS;

const MainLogo = ({ url = 'https://mail.protonmail.com/' }) => {
    const { APP_NAME } = useConfig();
    const [{ Plans } = {}] = useSubscription();

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

    return (
        <Href url={url} rel="noreferrer help" className="logo-container nodecoration flex-item-centered-vert">
            {logo}
        </Href>
    );
};

MainLogo.propTypes = {
    url: PropTypes.string
};

export default MainLogo;
