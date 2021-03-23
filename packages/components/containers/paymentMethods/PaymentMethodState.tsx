import React from 'react';
import { c } from 'ttag';
import { PaymentMethod } from 'proton-shared/lib/interfaces';
import { isExpired } from 'proton-shared/lib/helpers/card';
import { PAYMENT_METHOD_TYPES } from 'proton-shared/lib/constants';
import { Badge } from '../../components';

interface Props {
    method: PaymentMethod;
    index?: number;
}

const PaymentMethodState = ({ method, index }: Props) => {
    if (method.Type === PAYMENT_METHOD_TYPES.CARD && isExpired(method.Details)) {
        return (
            <Badge type="error">{`${c('Label on payment method').t`Expired`} ${method.Details.ExpMonth}/${
                method.Details.ExpYear
            }`}</Badge>
        );
    }

    if (!index) {
        return <Badge type="primary">{c('Label on payment method').t`Default`}</Badge>;
    }

    return null;
};

export default PaymentMethodState;
