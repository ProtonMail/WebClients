import React from 'react';
import PropTypes from 'prop-types';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { Alert } from 'react-components';
import { c } from 'ttag';

const PaymentInfo = ({ method }) => {
    if ([PAYMENT_METHOD_TYPES.BITCOIN, PAYMENT_METHOD_TYPES.CASH].includes(method)) {
        return null;
    }

    return <Alert>{c('Info').t`Your payment details are protected with TLS encryption and Swiss privacy laws.`}</Alert>;
};

PaymentInfo.propTypes = {
    method: PropTypes.string.isRequired,
};

export default PaymentInfo;
