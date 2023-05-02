import { c } from 'ttag';

import { PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { PaymentMethodType, methodMatches } from '@proton/shared/lib/interfaces';

interface Props {
    method?: PaymentMethodType;
}
const PaymentInfo = ({ method }: Props) => {
    if (methodMatches(method, [PAYMENT_METHOD_TYPES.BITCOIN, PAYMENT_METHOD_TYPES.CASH])) {
        return null;
    }

    return (
        <div className="mb-4">{c('Info')
            .t`Your payment details are protected with TLS encryption and Swiss privacy laws.`}</div>
    );
};

export default PaymentInfo;
