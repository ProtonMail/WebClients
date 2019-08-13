import React from 'react';
import PropTypes from 'prop-types';
import { Bordered } from 'react-components';
import { c } from 'ttag';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';

const PaymentMethodDetails = ({ type, details = {} }) => {
    const { Last4, Name, ExpMonth, ExpYear, Payer } = details;
    if (type === PAYMENT_METHOD_TYPES.CARD) {
        return (
            <Bordered className="bg-global-light">
                <h4>
                    <code>•••• •••• •••• {Last4}</code>
                </h4>
                <div className="flex-autogrid">
                    <div className="flex-autogrid-item">
                        <div>{c('Label').t`Cardholder name`}:</div>
                        <strong>{Name}</strong>
                    </div>
                    <div className="flex-autogrid-item">
                        <div>{c('Label for credit card').t`Expiration`}:</div>
                        <strong>
                            {ExpMonth}/{ExpYear}
                        </strong>
                    </div>
                </div>
            </Bordered>
        );
    }

    if (type === PAYMENT_METHOD_TYPES.PAYPAL) {
        return (
            <Bordered className="bg-global-light">
                <h4>
                    <code>PayPal {Payer}</code>
                </h4>
            </Bordered>
        );
    }

    return null;
};

PaymentMethodDetails.propTypes = {
    type: PropTypes.string.isRequired,
    details: PropTypes.object.isRequired
};

export default PaymentMethodDetails;
