import merge from 'lodash/merge';
import { c } from 'ttag';

import { Price, SkeletonLoader } from '@proton/components';
import type { PLANS } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';

const Pricing = ({ plan }: { plan: PLANS }) => {
    const payments = usePaymentOptimistic();

    const pricingInitialized = payments.initializationStatus.pricingInitialized;

    const planToCheck = {
        planIDs: { [plan]: 1 },
        cycle: payments.options.cycle,
        currency: payments.options.currency,
    };
    const coupon = payments.getCoupon(planToCheck);
    const price = payments.getPriceOrFallback(merge(planToCheck, { coupon, trial: false }));

    const currency = price.checkResult.Currency;

    const priceElement = (
        <Price
            key={`${plan}${payments.options.cycle}-price`}
            currency={currency}
            className="text-sm color-weak"
            suffix={c('Suffix').t`/month`}
        >
            {price.checkoutUi.withDiscountPerMonth}
        </Price>
    );

    return pricingInitialized ? (
        <span className="color-weak text-sm">{c('Signup').jt`Then ${priceElement}`}</span>
    ) : (
        <SkeletonLoader width="7rem" height="0.906rem" />
    );
};

export default Pricing;
