import type { ComponentType, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Price from '@proton/components/components/price/Price';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import type { IconSize } from '@proton/icons/types';
import type { PaymentsContextType } from '@proton/payments-hooks/ui/context/paymentsContext';
import { usePaymentOptimistic } from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import { CYCLE, PLAN_NAMES } from '@proton/payments/core/constants';

import FeatureItem from '../../../../referral/components/FeatureItem/FeatureItem';
import type { BusinessReferralPlan } from '../../../config/planConfigs';
import { getPlanCardPrices } from '../../../helpers/planPrice';
import { PlanLogo } from '../PlanLogo';

// The CRM lead-capture step ("Tell us about your business") is owned by this marketing page now,
// not a native step in this app — it redirects back to /signup/business, which
// SingleSignupSwitchContainer.tsx forwards into native checkout when a referrer is present.
const BUSINESS_REFERRAL_MARKETING_URL = 'https://proton.me/business/signup';

interface BusinessPlanFeatureItem {
    icon: ComponentType<{ size?: IconSize }>;
    textGetter: (payments: PaymentsContextType) => ReactNode;
    /** Marks this item's text as dependent on async pricing data — shown as a skeleton until `payments.initializationStatus.pricingInitialized`. */
    loading?: boolean;
}

export interface BusinessPlanConfig {
    plan: BusinessReferralPlan;
    icon: ReactNode;
    iconTitle: string;
    description: string;
    features: BusinessPlanFeatureItem[];
}

const PlanCard = ({ config }: { config: BusinessPlanConfig }) => {
    const payments = usePaymentOptimistic();
    const location = useLocation();
    const [{ b2c2b }] = useReferralInfo();
    const referralDiscountPercent = b2c2b.refereeRewardAmount;

    const planName = PLAN_NAMES[config.plan];
    const pricingInitialized = payments.initializationStatus.pricingInitialized;
    const prices = getPlanCardPrices(payments, config.plan);

    const perUserSuffix = c('Suffix').t`/user per month`;
    const priceElement = (
        <div className="flex flex-nowrap items-baseline gap-2">
            <Price
                key={`${config.plan}-original`}
                currency={prices.currency}
                className="text-lg text-strike business-referral-price-weak"
            >
                {prices.regularPricePerMonth}
            </Price>
            <Price
                key={`${config.plan}-price`}
                currency={prices.currency}
                className="text-xl text-semibold"
                suffix={perUserSuffix}
                suffixClassName="text-sm text-normal"
            >
                {prices.pricePerMonth}
            </Price>
        </div>
    );

    const renewalPriceElement = (
        <Price key={`${config.plan}-renewal`} currency={prices.currency} suffix={c('Suffix').t`/user/month`}>
            {prices.renewalPricePerMonth}
        </Price>
    );

    const handleCTAClick = () => {
        const currentParams = new URLSearchParams(location.search);
        const marketingParams = new URLSearchParams();
        marketingParams.set('plan', config.plan);
        marketingParams.set('billing', `${CYCLE.YEARLY}`);
        marketingParams.set('currency', prices.currency);
        for (const key of ['referrer', 'invite', 'coupon']) {
            const value = currentParams.get(key);
            if (value) {
                marketingParams.set(key, value);
            }
        }
        window.location.assign(`${BUSINESS_REFERRAL_MARKETING_URL}?${marketingParams.toString()}`);
    };

    return (
        <div className="w-full flex flex-column">
            <header
                className="flex flex-row justify-space-between items-center gap-2 min-h-custom"
                style={{ '--min-h-custom': '2.25rem' }}
            >
                <PlanLogo icon={config.icon} planName={planName} />
            </header>

            <p className="mt-4 mb-6 text-lg">{config.description}</p>

            <ul className="unstyled m-0 flex flex-column gap-2 mb-6">
                {config.features.map(({ icon: Icon, textGetter, loading }, index) => (
                    <FeatureItem
                        key={index}
                        icon={<Icon size={5} />}
                        text={textGetter(payments)}
                        loading={loading && !pricingInitialized}
                        highlighted
                    />
                ))}
            </ul>

            <div className="mb-2">
                {pricingInitialized ? priceElement : <SkeletonLoader width="7rem" height="1.5rem" />}
            </div>

            <Button
                onClick={handleCTAClick}
                size="large"
                color="norm"
                type="submit"
                fullWidth
                pill
                className="mt-2 py-4 text-semibold"
            >
                {c('Signup').t`Claim your additional ${referralDiscountPercent}% discount`}
            </Button>

            <div className="text-center mt-2 business-referral-price-weak">
                <div>{c('Signup').jt`${renewalPriceElement} after the first 12 months`}</div>
                <div>{c('Signup').t`Taxes may apply.`}</div>
            </div>
        </div>
    );
};

export default PlanCard;
