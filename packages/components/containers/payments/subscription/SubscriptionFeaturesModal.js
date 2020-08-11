import React from 'react';
import PropTypes from 'prop-types';
import { FormModal, useConfig } from 'react-components';
import { c } from 'ttag';
import { CYCLE, APPS, DEFAULT_CURRENCY } from 'proton-shared/lib/constants';

import VpnFeaturesTable from './VpnFeaturesTable';
import MailFeaturesTable from './MailFeaturesTable';

const SubscriptionFeaturesModal = ({ cycle = CYCLE.MONTHLY, currency = DEFAULT_CURRENCY, ...rest }) => {
    const { APP_NAME } = useConfig();
    const title = c('Title').t`Plans comparison`;
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    return (
        <FormModal title={title} footer={null} {...rest}>
            {isVPN ? <VpnFeaturesTable cycle={cycle} currency={currency} /> : <MailFeaturesTable cycle={cycle} currency={currency} />}
        </FormModal>
    );
};

SubscriptionFeaturesModal.propTypes = {
    cycle: PropTypes.number,
    currency: PropTypes.string,
};

export default SubscriptionFeaturesModal;
