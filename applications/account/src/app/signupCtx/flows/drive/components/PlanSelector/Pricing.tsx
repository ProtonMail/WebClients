import merge from 'lodash/merge';
import { c } from 'ttag';

import { Price, SkeletonLoader } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { PLANS } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';

import { getDriveMaxSpaceMap } from '../../helpers/getMaxSpaceMap';
import { SaveBadge } from '../SaveBadge/SaveBadge';

import './PlanCard.scss';

const Pricing = ({ plan, displayPerUserSpace = false }: { plan: PLANS; displayPerUserSpace?: boolean }) => {
    const payments = usePaymentOptimistic();

    const pricingInitialized = payments.initializationStatus.pricingInitialized;

    const maxSpace = getDriveMaxSpaceMap(payments);

    if (plan === PLANS.FREE) {
        return (
            <div className="min-h-custom mb-3 fade-in" style={{ '--min-h-custom': '5.5rem' }}>
                <div className="flex w-full justify-space-between items-center gap-1">
                    <span className="block text-5xl text-bold">{maxSpace[plan]}</span>
                </div>

                <div className="flex flex-column gap-1">
                    <div className="flex gap-2">
                        <span className="color-weak text-semibold">{c('Signup').t`Free`}</span>
                    </div>
                </div>
            </div>
        );
    }

    const planToCheck = {
        planIDs: { [plan]: 1 },
        cycle: payments.options.cycle,
        currency: payments.options.currency,
    };
    const coupon = payments.getCoupon(planToCheck);
    const price = payments.getPriceOrFallback(merge(planToCheck, { coupon }));

    const currency = price.checkResult.Currency;

    const priceDifferenceString = getSimplePriceString(currency, price?.checkoutUi.discountPerCycle ?? 0);

    const priceDifferencePercentage = price?.checkoutUi.discountPercent ?? 0;

    const hasSavings = (price?.checkoutUi.discountPerCycle ?? 0) > 0;

    return (
        <div className="min-h-custom mb-3 fade-in" style={{ '--min-h-custom': '5.5rem' }}>
            <div className="flex w-full justify-space-between items-center gap-1">
                <span className="block text-5xl text-bold">
                    {maxSpace[plan]}{' '}
                    {displayPerUserSpace ? <span className="text-sm">{c('Signup').t`/user`}</span> : null}
                </span>
                {pricingInitialized && priceDifferencePercentage > 0 ? (
                    <SaveBadge savePercentage={priceDifferencePercentage} />
                ) : null}
            </div>

            <div className="flex flex-column gap-1">
                {pricingInitialized ? (
                    <div className="flex gap-2">
                        {hasSavings ? (
                            <Price key={`${plan}-compare`} currency={currency} className="text-strike color-weak">
                                {price?.checkoutUi.withoutDiscountPerMonth ?? 0}
                            </Price>
                        ) : null}

                        <Price
                            key={`${plan}${payments.options.cycle}-price`}
                            currency={currency}
                            className="text-semibold color-weak"
                            suffix={<span className="text-sm color-weak">{c('Suffix').t`/month`}</span>}
                        >
                            {price?.checkoutUi.withDiscountPerMonth ?? 0}
                        </Price>
                    </div>
                ) : (
                    <SkeletonLoader width="100%" height="1.25rem" />
                )}
                {hasSavings ? (
                    <>
                        {pricingInitialized ? (
                            <span className="text-sm color-success">
                                {c('Signup').t`Save ${priceDifferenceString}`}
                            </span>
                        ) : (
                            <SkeletonLoader width="5rem" height="1rem" />
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default Pricing;
