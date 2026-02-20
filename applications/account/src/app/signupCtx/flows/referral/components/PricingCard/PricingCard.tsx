import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { VerticalStep } from '@proton/atoms/VerticalSteps/VerticalStep';
import { VerticalSteps } from '@proton/atoms/VerticalSteps/VerticalSteps';
import { AppsLogos, CycleSelector, SkeletonLoader } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getNormalizedPlanTitleToPlus } from '@proton/components/containers/payments/subscription/plusToPlusHelper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { CYCLE, PLANS, PLAN_NAMES, TRIAL_DURATION_DAYS } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import {
    getTrialRenewalAmountDueNoticeText,
    getTrialRenewalNoticeTextWithTermsAndConditions,
} from '@proton/payments/ui/components/RenewalNotice';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { getReferrerName } from '../../../../helpers/signupSearchParams';
import { getPlanIconPath } from '../../helpers/planIcons';
import { FreeFeatures } from '../Features/FreeFeatures';
import { NoCreditCardBadge } from '../Layout/NoCreditCardBadge';
import { PlanLogo } from '../Layout/PlanLogo';
import { TaxRow } from './TaxRow';

const PricingHeader = () => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);

    const referrerName = getReferrerName(searchParams);

    return (
        <>
            <div className="px-4 lg:px-8 flex flex-column gap-4 lg:gap-8">
                <div className="flex flex-nowrap items-center gap-2">
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
                <div className="flex justify-space-between items-center flex-nowrap items-center gap-2">
                    <PlanLogo
                        logoSrc={getPlanIconPath(selectedPlan.name)}
                        planName={
                            selectedPlan.name === PLANS.FREE
                                ? `${BRAND_NAME} ${PLAN_NAMES[PLANS.FREE]}`
                                : getNormalizedPlanTitleToPlus(selectedPlan.name)
                        }
                    />
                    <NoCreditCardBadge plan={selectedPlan.name} />
                </div>
            </div>
        </>
    );
};

const TrialExplanation = () => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;

    const planName = PLAN_NAMES[selectedPlan.getPlanName()];

    const [referralInfo, loadingReferralInfo] = useReferralInfo();

    return (
        <div className="px-4 lg:px-8">
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
                {loadingReferralInfo ? (
                    <SkeletonLoader width="100%" height="2.2rem" />
                ) : (
                    <VerticalStep
                        title={c('Signup').t`Get ${referralInfo.uiData.refereeRewardAmount} in credits`}
                        description={c('Signup').t`To redeem on your next paid subscription.`}
                        icon={<span className="m-auto">3</span>}
                        className="pb-0"
                    />
                )}
            </VerticalSteps>
        </div>
    );
};

export type PricingStep = 'account-details' | 'payment';

const PricingFooter = ({ step }: { step: PricingStep }) => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;
    const isPaidPlan = selectedPlan.name !== PLANS.FREE;
    const { eligibleTrials } = useEligibleTrials();
    const hasFullCheckoutDetails = payments.initializationStatus.pricingInitialized && !payments.loadingPaymentDetails;

    const planToCheck = {
        planIDs: { [payments.selectedPlan.name]: 1 },
        currency: payments.selectedPlan.currency,
        cycle: payments.selectedPlan.cycle,
    };

    const { checkoutUi } = payments.getPriceOrFallback({
        ...planToCheck,
        coupon: payments.getCoupon(planToCheck),
        /**
         * Ensure we check renewal price by setting trial to false
         */
        trial: false,
    });

    const priceWithDiscountPerMonth = getSimplePriceString(checkoutUi.currency, checkoutUi.withDiscountPerMonth);
    const priceWithDiscountPerCycle = getSimplePriceString(checkoutUi.currency, checkoutUi.withDiscountPerCycle);

    const willAutoRenew = eligibleTrials.creditCardRequiredPlans.includes(payments.selectedPlan.name);

    const showTaxRow = step === 'payment';
    const taxRow = showTaxRow && <TaxRow checkResult={payments.checkResult} />;

    const cycleOptions = [
        { text: c('Signup').t`Monthly`, value: CYCLE.MONTHLY },
        {
            text: c('Signup').t`Yearly`,
            value: CYCLE.YEARLY,
        },
    ];

    const showBillingCycle = isPaidPlan && step === 'payment';
    const billingCycle = showBillingCycle && (
        <div className="flex justify-space-between gap-2">
            <span>{c('Signup').t`Billing Cycle`}</span>
            <CycleSelector
                unstyled
                className="w-auto color-primary"
                cycle={checkoutUi.cycle}
                options={cycleOptions}
                mode="select-two"
                onSelect={(cycle) => {
                    if (cycle === 'lifetime') {
                        return;
                    }
                    void payments.selectCycle(cycle);
                }}
            />
        </div>
    );

    const showDivider = taxRow || billingCycle;
    const divider = showDivider && <hr className="my-4 bg-weak" />;

    const copyAfterTrial = () => {
        if (!hasFullCheckoutDetails) {
            return <SkeletonLoader width="100%" height="1.25rem" />;
        }
        if (willAutoRenew) {
            return <p className="m-0">{c('Signup').t`Then ${priceWithDiscountPerMonth} per month. Cancel anytime.`}</p>;
        }
        return <p className="m-0">{c('Signup').t`Then ${priceWithDiscountPerMonth} per month, if you subscribe.`}</p>;
    };

    const copyAfterTrialPayment = () => {
        if (!hasFullCheckoutDetails) {
            return <SkeletonLoader width="100%" height="1.25rem" />;
        }
        return (
            <div className="flex justify-space-between gap-2 text-rg">
                <span className="w-1/2">{getTrialRenewalAmountDueNoticeText()}</span>
                <span>{priceWithDiscountPerCycle}</span>
            </div>
        );
    };

    const total = (
        <>
            <div className="flex justify-space-between gap-2 text-lg">
                {willAutoRenew && step === 'payment' ? (
                    <>
                        <span className="text-semibold">{c('Signup').t`Amount due now`}</span>
                        <span className="text-semibold">{getSimplePriceString(checkoutUi.currency, 0)}</span>
                    </>
                ) : (
                    <>
                        <span className="text-semibold">{c('Signup').t`Total`}</span>
                        <span className="text-semibold">{
                            // translator: full sentence "Free for 14 days"
                            c('Signup').t`Free for ${TRIAL_DURATION_DAYS} days`
                        }</span>
                    </>
                )}
            </div>
            <div>{step === 'payment' && willAutoRenew ? copyAfterTrialPayment() : copyAfterTrial()}</div>
        </>
    );

    return (
        <footer className="border-top border-weak">
            <div className="flex flex-column px-4 lg:px-8 pt-5 gap-2">
                {billingCycle}
                {taxRow}
                {divider}
                {total}
            </div>
        </footer>
    );
};

const Free = () => {
    return (
        <div className="px-4 lg:px-8 flex flex-column">
            <h2 className="text-lg text-semibold mt-0 mb-3">{c('Signup').t`Every free account comes with:`}</h2>
            <div className="block lg:hidden">
                <AppsLogos
                    fullWidth
                    logoSize={8}
                    apps={[
                        APPS.PROTONMAIL,
                        APPS.PROTONCALENDAR,
                        APPS.PROTONVPN_SETTINGS,
                        APPS.PROTONDRIVE,
                        APPS.PROTONPASS,
                        APPS.PROTONDOCS,
                    ]}
                />
            </div>
            <div className="hidden lg:block">
                <AppsLogos
                    fullWidth
                    iconShape="appIcon"
                    logoSize={8}
                    apps={[
                        APPS.PROTONMAIL,
                        APPS.PROTONCALENDAR,
                        APPS.PROTONVPN_SETTINGS,
                        APPS.PROTONDRIVE,
                        APPS.PROTONPASS,
                        APPS.PROTONDOCS,
                    ]}
                />
            </div>
            <hr className="my-4 lg:my-8" />
            <ul className="unstyled flex flex-column gap-3 m-0">
                <FreeFeatures />
            </ul>
        </div>
    );
};

export const PricingCard = ({ step }: { step: PricingStep }) => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;
    const { eligibleTrials } = useEligibleTrials();
    const isPaidPlan = selectedPlan.name !== PLANS.FREE;
    const willAutoRenew = eligibleTrials.creditCardRequiredPlans.includes(payments.selectedPlan.name);

    const planToCheck = {
        planIDs: { [payments.selectedPlan.name]: 1 },
        currency: payments.selectedPlan.currency,
        cycle: payments.selectedPlan.cycle,
    };

    const { checkoutUi } = payments.getPriceOrFallback({
        ...planToCheck,
        coupon: payments.getCoupon(planToCheck),
        /**
         * Ensure we check renewal price by setting trial to false
         */
        trial: false,
    });

    const showRenewalNotice = willAutoRenew && step === 'payment';
    const renewalNotice = showRenewalNotice && (
        <p className="mb-0 mt-6 color-weak text-sm">
            {getTrialRenewalNoticeTextWithTermsAndConditions({
                renewCycle: checkoutUi.renewCycle,
                app: getAppFromPathnameSafe(location.pathname) || APPS.PROTONMAIL,
            })}
        </p>
    );

    return (
        <section className={clsx('referral-signup-pricing-card w-full flex flex-column')}>
            <div className="referral-signup-pricing-card-inner rounded-xl border border-weak fade-in w-full flex flex-column shadow-referral gap-4 lg:gap-8 py-4 lg:py-8 bg-norm">
                {isPaidPlan ? (
                    <>
                        <PricingHeader />
                        <TrialExplanation />
                        <PricingFooter step={step} />
                    </>
                ) : (
                    <Free />
                )}
            </div>
            {renewalNotice}
        </section>
    );
};
