import type { ReactNode } from 'react';

import { c } from 'ttag';

import { getCreditCardTypeByBrand } from '@proton/components/containers/payments/methods/PaymentMethodDetails';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedCardDetails, SavedMethodType, SavedPaymentMethod } from '@proton/payments/core/interface';
import { getBankSvg } from '@proton/payments/core/payment-methods/credit-card-icons';

import sepaBankIcon from './payment-method-icons/bank-transfer.svg';

interface Props {
    savedMethod: SavedPaymentMethod | undefined;
}

const iconBySavedMethodType: Partial<Record<SavedMethodType, (savedMethod: SavedPaymentMethod) => ReactNode>> = {
    [PAYMENT_METHOD_TYPES.CHARGEBEE_CARD]: (savedMethod) => {
        const { Brand } = savedMethod.Details as SavedCardDetails;
        return <img width="32" src={getBankSvg(getCreditCardTypeByBrand(Brand))} alt={Brand} />;
    },
    [PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL]: () => <img width="32" src={getBankSvg('paypal')} alt="PayPal" />,
    [PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT]: () => (
        <img width="32" src={sepaBankIcon} alt={c('Info').t`SEPA Bank transfer`} />
    ),
};

const SavedPaymentMethodIcon = ({ savedMethod }: Props) =>
    savedMethod ? (iconBySavedMethodType[savedMethod.Type]?.(savedMethod) ?? null) : null;

export default SavedPaymentMethodIcon;
