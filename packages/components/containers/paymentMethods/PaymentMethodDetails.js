import React from 'react';
import PropTypes from 'prop-types';

const PaymentMethodDetails = ({ type, details }) => {
    if (type === 'card') {
        return (
            <>
                <div>{details.Name}</div>
                <div>
                    {details.Brand} •••• •••• •••• {details.Last4}
                </div>
                <div>
                    {details.ExpMonth} / {details.ExpYear}
                </div>
                <div>
                    {details.ZIP} {details.Country}
                </div>
            </>
        );
    }

    return null;
};

PaymentMethodDetails.propTypes = {
    type: PropTypes.string.isRequired,
    details: PropTypes.object.isRequired
};

export default PaymentMethodDetails;
