import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Badge } from 'react-components';

const PaymentMethodState = ({ method, index }) => {
    const currentTime = new Date();
    const month = currentTime.getMonth() + 1;
    const year = currentTime.getFullYear();
    const { ExpMonth, ExpYear } = method.Details;

    if (ExpMonth >= month && ExpYear >= year) {
        return <Badge type="error">{c('Label on payment method').t`Expired`}</Badge>;
    }

    if (!index) {
        return <Badge type="success">{c('Label on payment method').t`Active`}</Badge>;
    }

    return null;
};

PaymentMethodState.propTypes = {
    method: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired
};

export default PaymentMethodState;