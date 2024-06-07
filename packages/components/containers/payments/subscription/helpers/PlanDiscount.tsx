import { Currency } from '@proton/shared/lib/interfaces';

import { getDiscountPrice } from '../SubscriptionCycleSelector';

interface PlanDiscountProps {
    loading?: boolean;
    discount: number;
    currency: Currency;
}

function PlanDiscount({ loading, discount, currency }: PlanDiscountProps) {
    return <span className="color-success flex shrink-0">{loading ? null : getDiscountPrice(discount, currency)}</span>;
}

export default PlanDiscount;
