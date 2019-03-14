import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { Badge } from 'react-components';
import { isExpired } from 'proton-shared/lib/helpers/card';

const PaymentMethodState = ({ method, index }) => {
    if (isExpired(method.Details)) {
        return (
            <Badge type="error">{`${c('Label on payment method').t`Expired`} ${method.Details.ExpMonth}/${
                method.Details.ExpYear
            }`}</Badge>
        );
    }

    if (!index) {
        return <Badge>{c('Label on payment method').t`Default`}</Badge>;
    }

    return null;
};

PaymentMethodState.propTypes = {
    method: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired
};

export default PaymentMethodState;
