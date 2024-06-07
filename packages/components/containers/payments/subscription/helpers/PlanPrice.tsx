import { c } from 'ttag';

import { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { EllipsisLoader, Price } from '../../../../components';

interface PlanPriceProps {
    loading?: boolean;
    currency: Currency;
    total: number;
    className?: string;
}

function PlanPrice({ loading, currency, total, className }: PlanPriceProps) {
    const totalPrice = (
        <Price className="ml-1" currency={currency} data-testid="subscription-total-price">
            {total}
        </Price>
    );

    return (
        <strong className={clsx('text-lg shrink-0 color-primary', className)}>
            {loading ? <EllipsisLoader /> : <>{c('Subscription price').jt`For ${totalPrice}`}</>}
        </strong>
    );
}

export default PlanPrice;
