import React from 'react';
import PropTypes from 'prop-types';
import creditCardType from 'credit-card-type';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { getLightOrDark } from 'proton-shared/lib/themes/helpers';

import treeDSecureSvgLight from 'design-system/assets/img/shared/bank-icons/3-d-secure.svg';
import treeDSecureSvgDark from 'design-system/assets/img/shared/bank-icons/3-d-secure-dark.svg';
import americanExpressSafekeySvgLight from 'design-system/assets/img/shared/bank-icons/american-express-safekey.svg';
import americanExpressSafekeySvgDark from 'design-system/assets/img/shared/bank-icons/american-express-safekey-dark.svg';
import discoverProtectBuySvgLight from 'design-system/assets/img/shared/bank-icons/discover-protectbuy.svg';
import discoverProtectBuySvgDark from 'design-system/assets/img/shared/bank-icons/discover-protectbuy-dark.svg';
import mastercardSecurecodeSvg from 'design-system/assets/img/shared/bank-icons/mastercard-securecode.svg';
import verifiedByVisaSvgLight from 'design-system/assets/img/shared/bank-icons/verified-by-visa.svg';
import verifiedByVisaSvgDark from 'design-system/assets/img/shared/bank-icons/verified-by-visa-dark.svg';
import paypalSvgLight from 'design-system/assets/img/shared/bank-icons/cc-paypal.svg';
import paypalSvgDark from 'design-system/assets/img/shared/bank-icons/cc-paypal-dark.svg';

const getImage = (type) => {
    const treeDSecureSvg = getLightOrDark(treeDSecureSvgLight, treeDSecureSvgDark);
    const americanExpressSafekeySvg = getLightOrDark(americanExpressSafekeySvgLight, americanExpressSafekeySvgDark);
    const discoverProtectBuySvg = getLightOrDark(discoverProtectBuySvgLight, discoverProtectBuySvgDark);
    const verifiedByVisaSvg = getLightOrDark(verifiedByVisaSvgLight, verifiedByVisaSvgDark);

    const images = {
        'american-express': americanExpressSafekeySvg,
        discover: discoverProtectBuySvg,
        mastercard: mastercardSecurecodeSvg,
        visa: verifiedByVisaSvg,
    };

    return images[type] || treeDSecureSvg;
};

const PaymentVerificationImage = ({ payment = {}, type: paymentMethodType = PAYMENT_METHOD_TYPES.CARD }) => {
    const paypalSvg = getLightOrDark(paypalSvgLight, paypalSvgDark);
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
