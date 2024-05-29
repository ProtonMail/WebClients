import { c } from 'ttag';

import { PAYMENT_METHOD_TYPES, PlainPaymentMethodType, methodMatches } from '@proton/components/payments/core';

interface Props {
    paymentMethodType?: PlainPaymentMethodType;
}

const PaymentInfo = ({ paymentMethodType }: Props) => {
    if (
        methodMatches(paymentMethodType, [
            PAYMENT_METHOD_TYPES.BITCOIN,
            PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
            PAYMENT_METHOD_TYPES.CASH,
        ])
    ) {
        return null;
    }

    return (
        <div className="mb-4">{c('Info')
            .t`Your payment details are protected with TLS encryption and Swiss privacy laws.`}</div>
    );
};

export default PaymentInfo;
