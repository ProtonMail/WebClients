import { c } from 'ttag';

import { Badge } from '@proton/components/components/badge/Badge';
import { isExpired } from '@proton/payments/core/cardDetails';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';

interface Props {
    method: SavedPaymentMethod;
}

const PaymentMethodState = ({ method }: Props) => {
    if (method.Type === PAYMENT_METHOD_TYPES.CARD && isExpired(method.Details)) {
        return (
            <Badge type="error" data-testid="expired">{`${c('Label on payment method').t`Expired`} ${
                method.Details.ExpMonth
            }/${method.Details.ExpYear}`}</Badge>
        );
    }

    if (method.IsDefault) {
        return <Badge type="primary" data-testid="default-badge">{c('Label on payment method').t`Default`}</Badge>;
    }

    return null;
};

export default PaymentMethodState;
