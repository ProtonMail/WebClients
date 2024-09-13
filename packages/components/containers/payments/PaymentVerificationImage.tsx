import creditCardType from 'credit-card-type';

import type { CardPayment, PaypalPayment } from '@proton/payments';
import { PAYMENT_METHOD_TYPES, isCardPayment, isPaypalPayment } from '@proton/payments';
import treeDSecureSvg from '@proton/styles/assets/img/bank-icons/3d-secure.svg';
import americanExpressSafekeySvg from '@proton/styles/assets/img/bank-icons/amex-safekey.svg';
import discoverProtectBuySvg from '@proton/styles/assets/img/bank-icons/discover-protectbuy.svg';
import mastercardSecurecodeSvg from '@proton/styles/assets/img/bank-icons/mastercard-securecode.svg';
import paypalSvg from '@proton/styles/assets/img/bank-icons/paypal.svg';
import verifiedByVisaSvg from '@proton/styles/assets/img/bank-icons/visa-secure.svg';

const getImage = (type: string): string => {
    const images: Record<string, string> = {
        'american-express': americanExpressSafekeySvg,
        discover: discoverProtectBuySvg,
        mastercard: mastercardSecurecodeSvg,
        visa: verifiedByVisaSvg,
    };

    return images[type] ?? treeDSecureSvg;
};

export interface Props {
    payment: PaypalPayment | CardPayment | {};
    type: PAYMENT_METHOD_TYPES.PAYPAL | PAYMENT_METHOD_TYPES.PAYPAL_CREDIT | PAYMENT_METHOD_TYPES.CARD;
}

const PaymentVerificationImage = ({ payment, type }: Props) => {
    const isPaypalType = [PAYMENT_METHOD_TYPES.PAYPAL, PAYMENT_METHOD_TYPES.PAYPAL_CREDIT].includes(type);

    if (isPaypalPayment(payment) || isPaypalType) {
        return <img src={paypalSvg} alt="PayPal" />;
    }

    if (!isCardPayment(payment)) {
        return null;
    }

    const cardTypes = creditCardType(payment.Details.Number);
    const { type: cardType, niceType } = cardTypes[0] ?? { type: '', niceType: '' };

    return <img src={getImage(cardType)} alt={niceType} />;
};

export default PaymentVerificationImage;
