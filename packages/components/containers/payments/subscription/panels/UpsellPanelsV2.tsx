import { c } from 'ttag';

import type { ButtonLikeShape } from '@proton/atoms';
import { type ThemeColorUnion } from '@proton/colors/types';
import Price from '@proton/components/components/price/Price';
import Time from '@proton/components/components/time/Time';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import type { CYCLE, FreeSubscription, FullPlansMap } from '@proton/payments';
import { PLANS, PLAN_NAMES, type Subscription } from '@proton/payments';
import { hasBundle } from '@proton/payments';
import { OfferPrice } from '@proton/payments/ui';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getPricingFromPlanIDs, getTotalFromPricing } from '@proton/shared/lib/helpers/planIDs';
import isTruthy from '@proton/utils/isTruthy';

import { type Upsell } from '../helpers';
import UpsellPanelV2 from './UpsellPanelV2';

const getPriceElement = (upsell: Upsell, highlightPrice: boolean | undefined) => {
    if (!upsell.price) {
        return null;
    }

    const priceColorClassName = highlightPrice ? 'text-5xl color-primary' : 'text-5xl color-norm';

    const { value, currency } = upsell.price;

    if (upsell.plan && upsell.customCycle) {
        return (
            <OfferPrice
                planToCheck={{ planIDs: { [upsell.plan]: 1 }, cycle: upsell.customCycle, currency }}
                suffix={c('new_plans: Plan frequency').t`/month`}
                wrapperClassName="text-semibold"
                currencyClassName={priceColorClassName}
                amountClassName={priceColorClassName}
                suffixClassName="color-norm"
                autosizeSkeletonLoader={false}
                skeletonLoaderProps={{
                    width: '10em',
                    height: '2.70em',
                }}
            />
        );
    }

    return (
        <Price
            key="plan-price"
            wrapperClassName="text-semibold"
            currencyClassName={priceColorClassName}
            amountClassName={priceColorClassName}
            suffixClassName="color-norm"
            currency={currency}
            suffix={c('new_plans: Plan frequency').t`/month`}
        >
            {value}
        </Price>
    );
};

const getSaveLabel = (plan: PLANS | undefined, cycle: CYCLE | undefined, plansMap: FullPlansMap) => {
    if (!plan || !cycle) {
        return;
    }

    const pricing = getPricingFromPlanIDs({ [plan]: 1 }, plansMap);
    const totals = getTotalFromPricing(pricing, cycle);

    if (!totals.discountPercentage) {
        return;
    }

    return (
        <span className="UpsellPanelV2-save-label text-uppercase font-semibold text-xs rounded ml-1 py-0.5 px-1">
            {c('upsell panel').t`Save ${totals.discountPercentage}%`}
        </span>
    );
};

const getDefaultCta = (upsell: Upsell) => {
    const label = c('new_plans: Action').t`Upgrade`;

    return {
        shape: 'outline' as ButtonLikeShape,
        color: 'norm' as ThemeColorUnion,
        action: upsell.onUpgrade,
        label,
        ...upsell.defaultCtaOverrides,
    };
};

interface Props {
    upsells: Upsell[];
    subscription?: Subscription | FreeSubscription;
}

const UpsellPanelsV2 = ({ upsells, subscription }: Props) => {
    const { plansMap } = usePreferredPlansMap();

    const formattedPeriodEndDate = (
        <Time format="PPP" key="period-end" data-testid="period-end">
            {subscription?.PeriodEnd}
        </Time>
    );

    // Currently supporting trials for Mail Plus and Unlimited.
    // Add more branching logic here if you need to add another trial plan.
    const trialPlanName: string = hasBundle(subscription) ? PLAN_NAMES[PLANS.BUNDLE] : MAIL_APP_NAME;

    return (
        <>
            {upsells.map((upsell) => {
                const defaultCta = upsell.ignoreDefaultCta ? null : getDefaultCta(upsell);
                const ctas = [defaultCta, ...upsell.otherCtas].filter(isTruthy);

                return (
                    <UpsellPanelV2
                        key={`upsell-${upsell.plan}-${upsell.customCycle}`}
                        title={upsell.title}
                        features={upsell.features}
                        isRecommended={upsell.isRecommended}
                        ctas={ctas}
                        plan={upsell.plan}
                        saveLabel={getSaveLabel(upsell.plan, upsell.customCycle, plansMap)}
                    >
                        {/* Warning when user is in Trial period for a plan */}
                        {upsell.isTrialEnding ? (
                            <>
                                <h4>{c('new_plans: Info').jt`Your trial ends ${formattedPeriodEndDate}`}</h4>
                                <div className="color-weak">
                                    {c('new_plans: Info')
                                        .t`To continue to use ${trialPlanName} with premium features, choose your subscription and payment options.`}
                                    <br />
                                    <br />
                                    {c('new_plans: Info')
                                        .t`Otherwise access to your account will be limited, and your account will eventually be disabled.`}
                                </div>
                            </>
                        ) : (
                            <div className="">
                                {upsell.description}
                                {getPriceElement(upsell, upsell.highlightPrice)}
                            </div>
                        )}
                    </UpsellPanelV2>
                );
            })}
        </>
    );
};

export default UpsellPanelsV2;
