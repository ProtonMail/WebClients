import React from 'react';
import PropTypes from 'prop-types';
import { FormModal, useConfig } from 'react-components';
import { c } from 'ttag';
import { CYCLE, CLIENT_TYPES, DEFAULT_CURRENCY } from 'proton-shared/lib/constants';

import VpnFeaturesTable from './VpnFeaturesTable';
import MailFeaturesTable from './MailFeaturesTable';

const SubscriptionFeaturesModal = ({ cycle = CYCLE.MONTHLY, currency = DEFAULT_CURRENCY, ...rest }) => {
    const { CLIENT_TYPE } = useConfig();
    const title = c('Title').t`Plans comparison`;

    return (
        <FormModal title={title} footer={null} {...rest}>
            {CLIENT_TYPE === CLIENT_TYPES.VPN ? <VpnFeaturesTable cycle={cycle} currency={currency} /> : null}
            {CLIENT_TYPE === CLIENT_TYPES.MAIL ? <MailFeaturesTable cycle={cycle} currency={currency} /> : null}
        </FormModal>
    );
};

SubscriptionFeaturesModal.propTypes = {
    cycle: PropTypes.number,
    currency: PropTypes.string
};

export default SubscriptionFeaturesModal;
