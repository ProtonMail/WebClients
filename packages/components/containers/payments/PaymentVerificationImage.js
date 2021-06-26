import React from 'react';
import PropTypes from 'prop-types';
import creditCardType from 'credit-card-type';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';

import treeDSecureSvg from 'design-system/assets/img/bank-icons/3d-secure.svg';
import americanExpressSafekeySvg from 'design-system/assets/img/bank-icons/amex-safekey.svg';
import discoverProtectBuySvg from 'design-system/assets/img/bank-icons/discover-protectbuy.svg';
import mastercardSecurecodeSvg from 'design-system/assets/img/bank-icons/mastercard-securecode.svg';
import verifiedByVisaSvg from 'design-system/assets/img/bank-icons/visa-secure.svg';
import paypalSvg from 'design-system/assets/img/bank-icons/paypal.svg';

const getImage = (type) => {
    const images = {
        'american-express': americanExpressSafekeySvg,
        discover: discoverProtectBuySvg,
        mastercard: mastercardSecurecodeSvg,
        visa: verifiedByVisaSvg,
    };

    return images[type] || treeDSecureSvg;
};

const PaymentVerificationImage = ({ payment = {}, type: paymentMethodType = PAYMENT_METHOD_TYPES.CARD }) => {
    if ([PAYMENT_METHOD_TYPES.PAYPAL, PAYMENT_METHOD_TYPES.PAYPAL_CREDIT].includes(paymentMethodType)) {
        return <img src={paypalSvg} alt="PayPal" />;
    }

    const { Details = {} } = payment;
    const [{ type, niceType } = {}] = creditCardType(Details.Number) || [];

    return <img src={getImage(type)} alt={niceType} />;
};

PaymentVerificationImage.propTypes = {
    payment: PropTypes.object,
    type: PropTypes.string,
};

export default PaymentVerificationImage;
