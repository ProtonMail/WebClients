import { c } from 'ttag';

import { PAYMENT_METHOD_TYPES, PaymentMethod } from '@proton/components/payments/core';
import { isExpired } from '@proton/shared/lib/helpers/card';

import { Badge } from '../../components';

interface Props {
    method: PaymentMethod;
    index?: number;
}

const PaymentMethodState = ({ method, index }: Props) => {
    if (method.Type === PAYMENT_METHOD_TYPES.CARD && isExpired(method.Details)) {
        return (
            <Badge type="error" data-testid="expired">{`${c('Label on payment method').t`Expired`} ${
                method.Details.ExpMonth
            }/${method.Details.ExpYear}`}</Badge>
        );
    }

    if (!index) {
        return <Badge type="primary" data-testid="default-badge">{c('Label on payment method').t`Default`}</Badge>;
    }

    return null;
};

export default PaymentMethodState;
