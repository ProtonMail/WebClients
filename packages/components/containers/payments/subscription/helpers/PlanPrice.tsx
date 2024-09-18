import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import type { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { EllipsisLoader } from '../../../../components';

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
            {loading ? <EllipsisLoader /> : <>{c('Subscription price').jt`For ${totalPrice}`}</>}
        </strong>
    );
}

export default PlanPrice;
