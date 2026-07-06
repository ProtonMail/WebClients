import { c } from 'ttag';

import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PlainPaymentMethodType } from '@proton/payments/core/interface';
import { methodMatches } from '@proton/payments/core/type-guards';

interface Props {
    paymentMethodType?: PlainPaymentMethodType;
}

const PaymentInfo = ({ paymentMethodType }: Props) => {
    if (methodMatches(paymentMethodType, [PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN, PAYMENT_METHOD_TYPES.CASH])) {
        return null;
    }

    return (
        <div className="mb-4">{c('Info')
            .t`Your payment details are protected with TLS encryption and Swiss privacy laws.`}</div>
    );
};

export default PaymentInfo;
