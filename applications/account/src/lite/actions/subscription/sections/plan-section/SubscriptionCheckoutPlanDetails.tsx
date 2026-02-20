import type { MutableRefObject, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { fromUnixTime, isPast, isToday } from 'date-fns';
import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Badge } from '@proton/components/components/badge/Badge';
import Price from '@proton/components/components/price/Price';
import Time from '@proton/components/components/time/Time';
import { PlanIcon } from '@proton/components/containers/payments/subscription/YourPlanSectionV2/PlanIcon';
import PlanIconName from '@proton/components/containers/payments/subscription/YourPlanSectionV2/PlanIconName';
import { getPlanTitlePlusMaybeBrand } from '@proton/components/containers/payments/subscription/YourPlanSectionV2/helpers';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { IcCreditCards } from '@proton/icons/icons/IcCreditCards';
import type { FreeSubscription, Subscription, SubscriptionCheckForbiddenReason } from '@proton/payments';
import { SubscriptionMode, isFreeSubscription, isTrial } from '@proton/payments';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import type { CheckoutView } from '@proton/payments/ui/headless-checkout/checkout-view';
import { isOrganization } from '@proton/shared/lib/organization/helper';

import { getDisplayName, getTrialPeriodText } from '../../helpers';
import WithLoadingIndicator from '../shared/WithLoadingIndicator';

import './SubscriptionCheckoutPlanDetails.scss';

const getSubscriptionStartDate = (
    subscription: Subscription | FreeSubscription,
    isTrial: boolean,
    isScheduled: boolean
) => {
    if (isFreeSubscription(subscription)) {
        return c('Checkout row').t`Starting today`;
    }
    const startDateUnixTime = !isTrial && isScheduled ? subscription.PeriodEnd : subscription.PeriodStart;
    const startDate = fromUnixTime(startDateUnixTime);

    const formattedStartDate = !isToday(startDate) ? (
        <Time sameDayFormat="PPP" key="period-start-text">
            {startDateUnixTime}
        </Time>
    ) : (
        c('Label').t`today`
    );

    if (isToday(startDate)) {
        return c('Checkout row').jt`Starting today`;
    }
    // translator: full sentence examples - `Starting 01 Jan 2036` or `Started 01 Jan 2026`
    return isPast(startDate)
        ? c('Checkout row').jt`Started ${formattedStartDate}`
        : c('Checkout row').jt`Starting ${formattedStartDate}`;
};

interface CheckoutViewProps {
    checkoutView: CheckoutView;
    loading: boolean;
}

const SubscriptionCheckoutFixedPlanSectionHeader = ({
    checkoutView,
    loading,
    showDiscountItem,
}: CheckoutViewProps & { showDiscountItem: boolean }) => {
    const { checkoutData } = checkoutView;
    const discountItem = checkoutData.getItem('discount');
    const planAmountItem = checkoutData.getItem('planAmount');
    const membersItem = checkoutData.getItem('members');

    return (
        <div className="fixed shadow-norm border-weak bg-norm top-0 left-0 w-full flex justify-space-between p-4 lite-app-fixed-plan-header z-up fade-in">
            <PlanIconName
                logo={<PlanIcon planName={checkoutData.planName} />}
                topLine={getPlanTitlePlusMaybeBrand(checkoutData.planTitle, checkoutData.planName)}
                bottomLine={
                    <div className="flex gap-1 items-center color-weak text-sm">
                        <span>{checkoutView.render('billingCycle')}</span>
                        <span className="color-hint text-xs">•</span>
                        <span>{membersItem.labelWithQuantity}</span>
                    </div>
                }
            />
            <div className="flex flex-column items-end shrink-0">
                <div className="text-rg">
                    <WithLoadingIndicator loading={loading}>
                        <Price
                            className="text-semibold"
                            currency={planAmountItem.currency}
                            data-testid="subscription-total-price"
                            key="total-price"
                        >
                            {planAmountItem.amount}
                        </Price>
                    </WithLoadingIndicator>
                </div>
                {showDiscountItem && (
                    <div className="flex gap-2 text-semibold text-sm color-success">
                        {c('Subscription').jt`${discountItem.discountPercent}% discount applied`}
                    </div>
                )}
            </div>
        </div>
    );
};

interface SubscriptionCheckoutPlanPriceSectionProps extends CheckoutViewProps {
    planSectionRef: MutableRefObject<HTMLDivElement | null>;
    showDiscountItem: boolean;
}

const SubscriptionCheckoutPlanPriceSection = ({
    planSectionRef,
    checkoutView,
    loading,
    showDiscountItem,
}: SubscriptionCheckoutPlanPriceSectionProps) => {
    const { checkoutData } = checkoutView;
    const discountItem = checkoutData.getItem('discount');

    return (
        <div className="flex bg-weak p-4 w-full justify-space-between" ref={planSectionRef}>
            <PlanIconName
                logo={<PlanIcon planName={checkoutData.planName} />}
                topLine={getPlanTitlePlusMaybeBrand(checkoutData.planTitle, checkoutData.planName)}
                bottomLine={
                    <WithLoadingIndicator loading={loading}>{checkoutView.render('billingCycle')}</WithLoadingIndicator>
                }
            />
            <div className="flex flex-column items-end shrink-0">
                <div className="flex gap-2">
                    <WithLoadingIndicator loading={loading} className="text-lg">
                        {showDiscountItem && (
                            <Badge
                                type="success"
                                tooltip={c('Info')
                                    .t`Price includes all applicable cycle-based discounts and non-expired coupons saved to your account.`}
                                className="text-semibold"
                            >
                                {c('Subscription').jt`${discountItem.discountPercent}% off`}
                            </Badge>
                        )}
                    </WithLoadingIndicator>
                </div>
            </div>
        </div>
    );
};

const SubscriptionCheckoutAddonSection = ({ checkoutView }: CheckoutViewProps) => {
    const { checkoutData } = checkoutView;

    return (
        <div className="p-4 w-full flex flex-column pb-0">
            <div className="flex flex-column gap-1">
                {checkoutView.render('members')}
                {checkoutView.render('addons')}
            </div>
            {!checkoutData.isLifetime && (
                <div className="flex items-end flex-column">
                    <div className="color-weak text-xs">{c('Suffix').t`/month`}</div>
                </div>
            )}
            <hr className="border-weak border-bottom m-0 mt-3" />
        </div>
    );
};

const SubscriptionCheckoutBoundToSection = () => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const nameToDisplay = getDisplayName(organization, user);
    return (
        <div className="color-weak text-sm" data-testid="lite:account-info">
            {/* translator: full sentence example, "Bound to organization Acme Corp" or "Bound to Eric Norbert" */}
            {isOrganization(organization)
                ? getBoldFormattedText(c('Subscription').t`Bound to organization **${nameToDisplay}**`)
                : getBoldFormattedText(c('Subscription').t`Bound to **${nameToDisplay}**`)}
        </div>
    );
};

function SubscriptionCheckoutInfoBanners(props: {
    trial: boolean;
    hasSavedPaymentMethods: boolean;
    paymentForbiddenReason: SubscriptionCheckForbiddenReason | undefined;
    periodEnd: ReactNode;
}) {
    return (
        <div className="w-full">
            {props.trial && !props.hasSavedPaymentMethods && props.paymentForbiddenReason?.reason && (
                <Banner variant="info" icon={<IcCreditCards />} className="mt-4">
                    {c('Subscription')
                        .jt`To continue your subscription after the free trial ends, add a payment method before ${props.periodEnd}.`}
                </Banner>
            )}
            {!props.trial && props.paymentForbiddenReason?.reason === 'already-subscribed' && (
                <Banner variant="info" className="mt-4">{c('Payments')
                    .t`You already have a subscription to this plan.`}</Banner>
            )}
        </div>
    );
}

interface BillingDetailsProps extends CheckoutViewProps {
    subscription: Subscription | FreeSubscription;
    paymentForbiddenReason: SubscriptionCheckForbiddenReason | undefined;
    hasSavedPaymentMethods: boolean;
}

const SubscriptionCheckoutBillingDate = ({
    checkoutView,
    loading,
    subscription,
    paymentForbiddenReason,
    hasSavedPaymentMethods,
}: BillingDetailsProps) => {
    const { checkoutData } = checkoutView;
    const trial = isTrial(subscription);
    const amountDueItem = checkoutData.getItem('amountDue');
    const planAmountItem = checkoutData.getItem('planAmount');
    const hasValidCoupon = checkoutData.checkResult.Coupon?.Code || checkoutData.checkResult.Gift;

    const amountDuePrice = (
        <Price currency={amountDueItem.currency} key="amount-due-today">
            {amountDueItem.amountDue}
        </Price>
    );

    const periodEnd = (
        <Time key="period-end-text" sameDayFormat="PPP">
            {subscription.PeriodEnd}
        </Time>
    );

    const isPeriodEndToday = !isFreeSubscription(subscription) && isToday(fromUnixTime(subscription.PeriodEnd));
    const formattedPeriodEnd = (
        <Time sameDayFormat="PPP" key="period-end-text">
            {subscription.PeriodEnd}
        </Time>
    );

    if (checkoutData.isLifetime) {
        return (
            <div className="w-full p-4">
                <div className="flex flex-column gap-2">
                    <div className="flex flex-column">
                        <div className="flex justify-space-between text-semibold">
                            <div className="flex flex-column">
                                <span>{c('Subscription').jt`Total due`}</span>
                                {checkoutView.render('taxInclusive')}
                            </div>
                            <strong>
                                <WithLoadingIndicator loading={loading}>{amountDuePrice}</WithLoadingIndicator>
                            </strong>
                        </div>
                    </div>
                    <SubscriptionCheckoutBoundToSection />
                </div>
                <SubscriptionCheckoutInfoBanners
                    trial={trial}
                    hasSavedPaymentMethods={hasSavedPaymentMethods}
                    paymentForbiddenReason={paymentForbiddenReason}
                    periodEnd={periodEnd}
                />
            </div>
        );
    } else if (trial && subscription && !isFreeSubscription(subscription)) {
        const trialCycleText = getTrialPeriodText(subscription);
        const amountDueToday =
            isPeriodEndToday || checkoutData.checkResult?.SubscriptionMode === SubscriptionMode.Regular;
        return (
            <div className="w-full p-4">
                <div className="flex flex-column gap-2 text-semibold">
                    {checkoutData.checkResult?.SubscriptionMode !== SubscriptionMode.Regular && trialCycleText && (
                        <div className="flex justify-space-between">
                            <span>
                                {getSubscriptionStartDate(subscription, trial, checkoutData.modifiers.isScheduled)}
                            </span>
                            <span>{c('Subscription').jt`${trialCycleText} free`}</span>
                        </div>
                    )}
                    <div className="flex justify-space-between text-semibold">
                        <span className="inline-flex items-center">
                            <div className="flex flex-column">
                                <span>
                                    {amountDueToday
                                        ? c('Subscription').jt`Total due today`
                                        : c('Subscription').jt`Total due on ${formattedPeriodEnd}`}
                                </span>
                                {checkoutView.render('taxInclusive')}
                            </div>
                        </span>
                        <WithLoadingIndicator loading={loading}>
                            <Price currency={amountDueItem.currency}>
                                {amountDueToday ? amountDueItem.amountDue : planAmountItem.amount}
                            </Price>
                        </WithLoadingIndicator>
                    </div>
                    <SubscriptionCheckoutBoundToSection />
                </div>
                <SubscriptionCheckoutInfoBanners
                    trial={trial}
                    hasSavedPaymentMethods={hasSavedPaymentMethods}
                    paymentForbiddenReason={paymentForbiddenReason}
                    periodEnd={periodEnd}
                />
            </div>
        );
    }
    return (
        <div className="w-full p-4">
            <div className="flex flex-column gap-2">
                {!paymentForbiddenReason?.reason && (
                    <div className="flex justify-space-between text-semibold">
                        <div className="inline-flex items-center">
                            <div className="flex flex-column">
                                <span>
                                    {isFreeSubscription(subscription) && !hasValidCoupon
                                        ? planAmountItem.label
                                        : c('Subscription').jt`Total due today`}
                                </span>
                                {checkoutView.render('taxInclusive')}
                            </div>
                        </div>
                        {checkoutView.render('amountDue')}
                    </div>
                )}
                <div className="flex justify-space-between">
                    {c('Subscription').jt`Next billing date`}
                    <span data-testid="lite:checkout:renewal-date">
                        <WithLoadingIndicator loading={loading}>
                            {checkoutView.getItem('nextBilling').renewalTime}
                        </WithLoadingIndicator>
                    </span>
                </div>
                <SubscriptionCheckoutBoundToSection />
            </div>
            <SubscriptionCheckoutInfoBanners
                trial={trial}
                hasSavedPaymentMethods={hasSavedPaymentMethods}
                paymentForbiddenReason={paymentForbiddenReason}
                periodEnd={periodEnd}
            />
        </div>
    );
};

interface ProrationSectionProps extends CheckoutViewProps {
    paymentForbiddenReason: SubscriptionCheckForbiddenReason | undefined;
}

const SubscriptionCheckoutProration = ({ checkoutView, paymentForbiddenReason }: ProrationSectionProps) => {
    const { checkoutData } = checkoutView;

    const adjustmentTypes = ['proration', 'unusedCredit', 'coupon', 'gift', 'credit', 'taxExclusive'] as const;

    const hasVisibleAdjustments = adjustmentTypes.some((type) => checkoutData.getItem(type).visible);
    const isSectionVisible = hasVisibleAdjustments || checkoutData.isTrial;

    if (!isSectionVisible && !paymentForbiddenReason?.reason) {
        return null;
    }

    return (
        <div className="p-4 w-full flex flex-column gap-1 pb-0">
            {checkoutView.render('planAmount')}
            {checkoutView.render('proration')}
            {checkoutView.render('unusedCredit')}
            {checkoutView.render('coupon')}
            {checkoutView.render('gift')}
            {checkoutView.render('credit')}
            {checkoutView.render('taxExclusive')}
            <hr className="border-weak border-bottom m-0 mt-3" />
        </div>
    );
};

interface Props {
    hasSavedPaymentMethods: boolean;
    checkoutView: CheckoutView;
    paymentForbiddenReason: SubscriptionCheckForbiddenReason | undefined;
}

const SubscriptionCheckoutPlanDetails = ({ hasSavedPaymentMethods, checkoutView, paymentForbiddenReason }: Props) => {
    const planSectionRef = useRef<HTMLDivElement>(null);
    const [showFixedHeader, setShowFixedHeader] = useState(false);
    const { subscription, loading } = usePayments();

    useEffect(() => {
        if (!planSectionRef.current) {
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setShowFixedHeader(false);
                    if (entry.intersectionRatio === 0) {
                        setShowFixedHeader(true);
                    }
                });
            },
            {
                threshold: 0, // threshold: 0 will ensure the whole section is hidden before triggering the callback
            }
        );

        observer.observe(planSectionRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    if (!subscription) {
        return null;
    }

    const discountItem = checkoutView.getItem('discount');
    const showDiscountItem = !loading && discountItem.visible && !checkoutView.checkoutData.isTrial;

    return (
        <>
            {showFixedHeader && (
                <SubscriptionCheckoutFixedPlanSectionHeader
                    checkoutView={checkoutView}
                    loading={loading}
                    showDiscountItem={showDiscountItem}
                />
            )}
            <section className="flex flex-column border border-weak shadow-raised rounded-lg my-4 lite-app-plan-card">
                <SubscriptionCheckoutPlanPriceSection
                    planSectionRef={planSectionRef}
                    checkoutView={checkoutView}
                    loading={loading}
                    showDiscountItem={showDiscountItem}
                />
                <SubscriptionCheckoutAddonSection checkoutView={checkoutView} loading={loading} />
                <SubscriptionCheckoutProration
                    checkoutView={checkoutView}
                    loading={loading}
                    paymentForbiddenReason={paymentForbiddenReason}
                />
                <SubscriptionCheckoutBillingDate
                    checkoutView={checkoutView}
                    loading={loading}
                    subscription={subscription}
                    paymentForbiddenReason={paymentForbiddenReason}
                    hasSavedPaymentMethods={hasSavedPaymentMethods}
                />
            </section>
        </>
    );
};

export default SubscriptionCheckoutPlanDetails;
