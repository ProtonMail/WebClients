import { getCreditCardTypeByBrand } from '@proton/components/containers/payments/methods/PaymentMethodDetails';
import type { PlainPaymentMethodType } from '@proton/payments';
import { PAYMENT_METHOD_TYPES } from '@proton/payments';
import { getBankSvg } from '@proton/payments/ui';

import additionalCardsIcon from './payment-method-icons/additional-cards.svg';
import applePayIcon from './payment-method-icons/apple-pay.svg';
import bankTransferIcon from './payment-method-icons/bank-transfer.svg';
import bitcoinIcon from './payment-method-icons/bitcoin.svg';
import googlePaySvg from './payment-method-icons/google-pay.svg';
import paypalIcon from './payment-method-icons/paypal.svg';

const visaIcon = getBankSvg(getCreditCardTypeByBrand('Visa'));
const masterCardIcon = getBankSvg(getCreditCardTypeByBrand('MasterCard'));
const amexIcon = getBankSvg(getCreditCardTypeByBrand('American Express'));

interface Props {
    type: PlainPaymentMethodType;
}

const PaymentMethodIcon = ({ type }: Props) => {
    if (type === PAYMENT_METHOD_TYPES.GOOGLE_PAY) {
        return <img src={googlePaySvg} alt="Google pay" />;
    } else if (type === PAYMENT_METHOD_TYPES.APPLE_PAY) {
        return <img src={applePayIcon} alt="Apple pay" />;
    } else if (type === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT) {
        return <img src={bankTransferIcon} alt="SEPA" />;
    } else if (type === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
        return <img src={bitcoinIcon} alt="Bitcoin" />;
    } else if (type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
        return <img src={paypalIcon} alt="PayPal" />;
    } else if (type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD) {
        return (
            <span className="flex gap-1">
                <img src={visaIcon} alt="Visa" width="32" />
                <img src={masterCardIcon} alt="Mastercard" width="32" />
                <img src={amexIcon} alt="American Express" width="32" />
                <img src={additionalCardsIcon} alt="More cards" />
            </span>
        );
    }
    return null;
};

export default PaymentMethodIcon;
