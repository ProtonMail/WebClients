import React from 'react';
import PropTypes from 'prop-types';
import { Bordered } from 'react-components';
import { c } from 'ttag';

const PaymentMethodDetails = ({ type, details }) => {
    if (type === 'card') {
        return (
            <Bordered className="bg-global-light">
                <h2>
                    <code>•••• •••• •••• {details.Last4}</code>
                </h2>
                <div className="flex-autogrid">
                    <div className="flex-autogrid-item">
                        <div>{c('Label').t`Cardholder name`}:</div>
                        <strong>{details.Name}</strong>
                    </div>
                    <div className="flex-autogrid-item">
                        <div>{c('Label for credit card').t`Expiration`}:</div>
                        <strong>
                            {details.ExpMonth}/{details.ExpYear}
                        </strong>
                    </div>
                </div>
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
