import React from 'react';
import PropTypes from 'prop-types';
import creditCardType from 'credit-card-type';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import treeDSecureSvg from 'design-system/assets/img/shared/bank-icons/3-d-secure.svg';
import americanExpressSafekeySvg from 'design-system/assets/img/shared/bank-icons/american-express-safekey.svg';
import discoverProtectBuySvg from 'design-system/assets/img/shared/bank-icons/discover-protectbuy.svg';
import mastercardSecurecodeSvg from 'design-system/assets/img/shared/bank-icons/mastercard-securecode.svg';
import verifiedByVisaSvg from 'design-system/assets/img/shared/bank-icons/verified-by-visa.svg';

const IMAGES = {
    ['american-express']: americanExpressSafekeySvg,
    discover: discoverProtectBuySvg,
    mastercard: mastercardSecurecodeSvg,
    visa: verifiedByVisaSvg
};

const PaymentVerificationImage = ({ payment = {} }) => {
    const { Details = {}, Type = '' } = payment;

    if (Type !== PAYMENT_METHOD_TYPES.CARD) {
        return null;
    }

    const [{ type = '', niceType = '' } = {}] = creditCardType(Details.Number) || [];
    return <img src={IMAGES[type] || treeDSecureSvg} alt={niceType} />;
};

PaymentVerificationImage.propTypes = {
    payment: PropTypes.object
};

export default PaymentVerificationImage;
