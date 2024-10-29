import { type Currency } from '@proton/payments';

import { getDiscountPrice } from './getDiscountPrice';

interface PlanDiscountProps {
    loading?: boolean;
    discount: number;
    currency: Currency;
}

function PlanDiscount({ loading, discount, currency }: PlanDiscountProps) {
    return <span className="color-success flex shrink-0">{loading ? null : getDiscountPrice(discount, currency)}</span>;
}

export default PlanDiscount;
