import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { VerticalStep, VerticalSteps } from '@proton/atoms';
import { SkeletonLoader } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { referralReward } from '@proton/components/containers/referral/constants';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { PLANS, PLAN_NAMES, TRIAL_DURATION_DAYS } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { getReferrerName } from '../../../../helpers/signupSearchParams';
import { getPlanIconPath } from '../../helpers/planIcons';
import type { SupportedReferralPlans } from '../../helpers/plans';
import { plansRequiringPaymentToken } from '../../helpers/plans';

const LogoIconShape = ({ children, border = true }: { children: ReactNode; border?: boolean }) => {
    return (
        <div
            className={clsx(
                'w-custom ratio-square rounded-lg overflow-hidden flex items-center justify-center shrink-0',
                border ? 'border border-weak' : undefined
            )}
            style={{ '--w-custom': '2.75rem', backgroundColor: 'white' }}
            aria-hidden="true"
        >
            {children}
        </div>
    );
};

const PricingHeader = () => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const referrerName = getReferrerName(searchParams);

    return (
        <>
            <div className="px-4 lg:px-8 flex flex-nowrap items-center gap-2">
                <span
                    className="rounded text-semibold py-0.5 px-1 color-primary shrink-0"
                    style={{ backgroundColor: 'rgb(109 74 255 / 0.08)' }}
                >{c('Signup').t`Your trial`}</span>
                {referrerName && (
                    <span className="text-ellipsis">
                        {getBoldFormattedText(c('Signup').t`Gifted by **${referrerName}**`, 'text-semibold')}
                    </span>
                )}
            </div>
            <header className="flex flex-nowrap gap-4 items-center px-4 lg:px-8">
                <LogoIconShape>
                    <img src={getPlanIconPath(selectedPlan.name)} alt="" />
                </LogoIconShape>
                <span className="text-2xl text-semibold" data-testid="planName">
                    {selectedPlan.name === PLANS.FREE
                        ? `${BRAND_NAME} ${PLAN_NAMES[PLANS.FREE]}`
                        : selectedPlan.getPlan().Title}
                </span>
            </header>
        </>
    );
};

const TrialExplanation = () => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;

    const planName = PLAN_NAMES[selectedPlan.getPlanName()];

    const creditCardRequired = plansRequiringPaymentToken.includes(selectedPlan.name as SupportedReferralPlans);

    return (
        <div className="px-4 lg:px-8">
            {!creditCardRequired && <p className="mt-0 mb-2">{c('Signup').t`No credit card required:`}</p>}

            <VerticalSteps className="vertical-steps--primary mb-0">
                <VerticalStep
                    title={c('Signup').t`Create a ${BRAND_NAME} Account`}
                    description={c('Signup').t`Enjoy secure, easy-to-use ${BRAND_NAME} apps.`}
                    icon={<span className="m-auto">1</span>}
                />
                <VerticalStep
                    title={c('Signup').t`Try ${planName} for free`}
                    description={c('Signup').t`We’ll email you before your trial ends.`}
                    icon={<span className="m-auto">2</span>}
                />
                <VerticalStep
                    title={c('Signup').t`Get ${referralReward} in credits`}
                    description={c('Signup').t`To redeem on your next paid subscription.`}
                    icon={<span className="m-auto">3</span>}
                    className="pb-0"
                />
            </VerticalSteps>
        </div>
    );
};

const PricingFooter = () => {
    const payments = usePaymentOptimistic();

    const hasFullCheckoutDetails = payments.initializationStatus.pricingInitialized && !payments.loadingPaymentDetails;

    const planToCheck = {
        planIDs: { [payments.selectedPlan.name]: 1 },
        currency: payments.currency,
        cycle: payments.selectedPlan.cycle,
    };

    const { uiData } = payments.getPriceOrFallback({
        ...planToCheck,
        coupon: payments.getCoupon(planToCheck),
        /**
         * Ensure we check renewal price by setting trial to false
         */
        trial: false,
    });

    const priceWithDiscountPerMonth = getSimplePriceString(uiData.currency, uiData.withDiscountPerMonth);

    const total = (
        <>
            <div className="flex justify-space-between gap-2 text-lg">
                <span className="text-semibold">{c('Signup').t`Total`}</span>
                <span className="text-semibold">{
                    // translator: full sentence "Free for 14 days"
                    c('Signup').t`Free for ${TRIAL_DURATION_DAYS} days`
                }</span>
            </div>
            <div>
                {hasFullCheckoutDetails ? (
                    <p className="m-0">
                        {c('Signup').t`Then ${priceWithDiscountPerMonth} per month, if you subscribe.`}
                    </p>
                ) : (
                    <SkeletonLoader width="100%" height="1.25rem" />
                )}
            </div>
        </>
    );

    return (
        <footer className="border-top border-weak">
            <div className="flex flex-column px-4 lg:px-8 pt-5 gap-2">{total}</div>
        </footer>
    );
};

export const PricingCard = () => {
    return (
        <section className={clsx('referral-signup-pricing-card w-full flex flex-column')}>
            <div className="referral-signup-pricing-card-inner rounded-xl fade-in w-full flex flex-column shadow-raised gap-4 lg:gap-8 py-4 lg:py-8 bg-norm">
                <PricingHeader />
                <TrialExplanation />
                <PricingFooter />
            </div>
        </section>
    );
};
