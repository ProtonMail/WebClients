import { PAYMENT_METHOD_TYPE, PAYMENT_METHOD_TYPES } from '@proton/shared/lib/constants';
import { c } from 'ttag';

import { Alert } from '../../components';

interface Props {
    method?: PAYMENT_METHOD_TYPE;
}
const PaymentInfo = ({ method }: Props) => {
    if (method && [PAYMENT_METHOD_TYPES.BITCOIN, PAYMENT_METHOD_TYPES.CASH].includes(method as any)) {
        return null;
    }

    return <Alert>{c('Info').t`Your payment details are protected with TLS encryption and Swiss privacy laws.`}</Alert>;
};

export default PaymentInfo;
