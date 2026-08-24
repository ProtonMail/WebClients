import { c } from 'ttag';

import type { Currency } from '@proton/payments/core/interface';
import clsx from '@proton/utils/clsx';

import Price from '../../../../components/price/Price';

interface PlanPriceProps {
    loading?: boolean;
    currency: Currency;
    total: number;
    className?: string;
}

function PlanPrice({ loading, currency, total, className }: PlanPriceProps) {
    const totalPrice = (
        <Price currency={currency} data-testid="subscription-total-price" key="total-price">
            {total}
        </Price>
    );

    return (
        <strong className={clsx('text-lg shrink-0 color-primary', className)}>
            {loading ? null : <>{c('Subscription price').jt`For ${totalPrice}`}</>}
        </strong>
    );
}

export default PlanPrice;
