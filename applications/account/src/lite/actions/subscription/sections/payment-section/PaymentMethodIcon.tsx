import type { ReactNode } from 'react';

import { c } from 'ttag';

import { getCreditCardTypeByBrand } from '@proton/components/containers/payments/methods/PaymentMethodDetails';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PlainPaymentMethodType } from '@proton/payments/core/interface';
import { getBankSvg } from '@proton/payments/core/payment-methods/credit-card-icons';

import additionalCardsIcon from './payment-method-icons/additional-cards.svg';
import applePayIcon from './payment-method-icons/apple-pay.svg';
import bankTransferIcon from './payment-method-icons/bank-transfer.svg';
import bitcoinIcon from './payment-method-icons/bitcoin.svg';
import googlePaySvg from './payment-method-icons/google-pay.svg';
import idealIcon from './payment-method-icons/ideal.svg';
import paypalIcon from './payment-method-icons/paypal.svg';

const visaIcon = getBankSvg(getCreditCardTypeByBrand('Visa'));
const masterCardIcon = getBankSvg(getCreditCardTypeByBrand('MasterCard'));
const amexIcon = getBankSvg(getCreditCardTypeByBrand('American Express'));

interface Props {
    type: PlainPaymentMethodType;
}

const iconByMethodType: Partial<Record<PlainPaymentMethodType, () => ReactNode>> = {
    [PAYMENT_METHOD_TYPES.GOOGLE_PAY]: () => <img src={googlePaySvg} alt="Google Pay" />,
    [PAYMENT_METHOD_TYPES.APPLE_PAY]: () => <img src={applePayIcon} alt="Apple Pay" />,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: () => <img src={bankTransferIcon} alt="SEPA" />,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN]: () => <img src={bitcoinIcon} alt="Bitcoin" />,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: () => <img src={paypalIcon} alt="PayPal" />,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL]: () => <img src={idealIcon} alt="iDEAL" />,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: () => (
        <span className="flex gap-1">
            <img src={visaIcon} alt="Visa" width="32" />
            <img src={masterCardIcon} alt="Mastercard" width="32" />
            <img src={amexIcon} alt="American Express" width="32" />
            <img src={additionalCardsIcon} alt={c('Info').t`More cards`} />
        </span>
    ),
};

const PaymentMethodIcon = ({ type }: Props) => iconByMethodType[type]?.() ?? null;

export default PaymentMethodIcon;
