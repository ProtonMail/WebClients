import type { MutableRefObject, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { fromUnixTime, isPast, isToday } from 'date-fns';
import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Badge from '@proton/components/components/badge/Badge';
import Info from '@proton/components/components/link/Info';
import Price from '@proton/components/components/price/Price';
import Time from '@proton/components/components/time/Time';
import { getRenewalTime } from '@proton/components/containers/payments/RenewalNotice';
import { PlanIcon } from '@proton/components/containers/payments/subscription/YourPlanSectionV2/PlanIcon';
import PlanIconName from '@proton/components/containers/payments/subscription/YourPlanSectionV2/PlanIconName';
import { getPlanTitlePlusMaybeBrand } from '@proton/components/containers/payments/subscription/YourPlanSectionV2/helpers';
import { getTotalBillingText } from '@proton/components/containers/payments/subscription/helpers';
import { AddonTooltip } from '@proton/components/containers/payments/subscription/modal-components/helpers/AddonTooltip';
import { checkoutGetNetTotalAmount } from '@proton/components/containers/payments/subscription/modal-components/helpers/checkoutGetNetTotalAmount';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useConfig from '@proton/components/hooks/useConfig';
import { IcCreditCards } from '@proton/icons/icons/IcCreditCards';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcMoneyBills } from '@proton/icons/icons/IcMoneyBills';
import { IcTagFilled } from '@proton/icons/icons/IcTagFilled';
import type { FreeSubscription, Subscription, SubscriptionCheckForbiddenReason } from '@proton/payments';
import {
    SubscriptionMode,
    TaxInclusive,
    formatTax,
    getCheckoutModifiers,
    isFreeSubscription,
    isLifetimePlanSelected,
    isSubscriptionCheckForbiddenWithReason,
    isTrial,
} from '@proton/payments';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isOrganization } from '@proton/shared/lib/organization/helper';
import clsx from '@proton/utils/clsx';

import {
    getAddonTitle,
    getBillingPeriodText,
    getDisplayName,
    getTrailPeriodText,
    useMemberAddonPrice,
} from '../../helpers';
import VatInclusiveText from '../shared/VatInclusiveText';
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

const SubscriptionCheckoutFixedPlanSectionHeader = () => {
    const { checkoutUi, loading, getShouldPassTrial, couponConfig } = usePayments();
    const { usersTitle, planTitle, planName, discountPercent, checkResult, cycle, planIDs, currency } = checkoutUi;
    const shouldPassIsTrial = getShouldPassTrial(planIDs, cycle, false);
    const showDiscount =
        !loading &&
        discountPercent !== 0 &&
        checkResult.SubscriptionMode !== SubscriptionMode.CustomBillings &&
        !shouldPassIsTrial;

    const amount = checkoutGetNetTotalAmount(checkoutUi, shouldPassIsTrial, couponConfig);

    const totalPrice = (
        <Price className="text-semibold" currency={currency} data-testid="subscription-total-price" key="total-price">
            {amount}
        </Price>
    );

    return (
        <div className="fixed shadow-norm border-weak bg-norm top-0 left-0 w-full flex justify-space-between p-4 lite-app-fixed-plan-header z-up fade-in">
            <PlanIconName
                logo={<PlanIcon planName={planName} />}
                topLine={getPlanTitlePlusMaybeBrand(planTitle, planName)}
                bottomLine={
                    <div className="flex gap-1 items-center color-weak text-sm">
                        <span>{getBillingPeriodText(cycle, planIDs)}</span>
                        <span className="color-hint text-xs">•</span>
                        <span>{usersTitle}</span>
                    </div>
                }
            />
            <div className="flex flex-column items-end shrink-0">
                <div className="text-rg">
                    <WithLoadingIndicator loading={loading}>{totalPrice}</WithLoadingIndicator>
                </div>
                {showDiscount && (
                    <div className="flex gap-2 text-semibold text-sm color-success">
                        {c('Subscription').jt`${discountPercent}% discount applied`}
                    </div>
                )}
            </div>
        </div>
    );
};

interface SubscriptionCheckoutPlanPriceSectionProps {
    planSectionRef: MutableRefObject<HTMLDivElement | null>;
}

const SubscriptionCheckoutPlanPriceSection = ({ planSectionRef }: SubscriptionCheckoutPlanPriceSectionProps) => {
    const { checkoutUi, loading, getShouldPassTrial } = usePayments();
    const { planTitle, planName, discountPercent, checkResult, cycle, planIDs } = checkoutUi;
    const shouldPassTrial = getShouldPassTrial(planIDs, cycle, false);
    const showDiscountBadge =
        !loading &&
        discountPercent !== 0 &&
        checkResult.SubscriptionMode !== SubscriptionMode.CustomBillings &&
        !shouldPassTrial;

    return (
        <div className="flex bg-weak p-4 w-full justify-space-between" ref={planSectionRef}>
            <PlanIconName
                logo={<PlanIcon planName={planName} />}
                topLine={getPlanTitlePlusMaybeBrand(planTitle, planName)}
                bottomLine={
                    <WithLoadingIndicator loading={loading}>
                        <span className="text-sm">{getBillingPeriodText(cycle, planIDs)}</span>
                    </WithLoadingIndicator>
                }
            />
            <div className="flex flex-column items-end shrink-0">
                <div className="flex gap-2">
                    <WithLoadingIndicator loading={loading} className="text-lg">
                        {showDiscountBadge && (
                            <Badge
                                type="success"
                                tooltip={c('Info')
                                    .t`Price includes all applicable cycle-based discounts and non-expired coupons saved to your account.`}
                                className="text-semibold"
                            >
                                {c('Subscription').jt`${discountPercent}% off`}
                            </Badge>
                        )}
                    </WithLoadingIndicator>
                </div>
            </div>
        </div>
    );
};

const SubscriptionCheckoutAddonSection = () => {
    const { checkoutUi, loading } = usePayments();
    const { planIDs, usersTitle, currency, addons, cycle, checkResult } = checkoutUi;
    const membersAmount = useMemberAddonPrice();
    const lifetimePlan = isLifetimePlanSelected(planIDs);

    return (
        <div className="p-4 w-full flex flex-column pb-0">
            <div className="flex flex-column gap-1">
                <div className="flex justify-space-between">
                    {usersTitle}
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={currency}>{lifetimePlan ? checkResult.Amount : membersAmount}</Price>
                    </WithLoadingIndicator>
                </div>
                {addons.map((addon) => {
                    const pricePerAddon = (addon.pricing[cycle] || 0) / cycle;
                    const addonAmount = addon.quantity * pricePerAddon;
                    return (
                        <div className="flex justify-space-between" key={addon.name}>
                            <div>
                                {getAddonTitle(addon.name, addon.quantity, planIDs)}
                                <AddonTooltip addon={addon} pricePerAddon={pricePerAddon} currency={currency} />
                            </div>
                            <WithLoadingIndicator loading={loading}>
                                <Price currency={currency}>{addonAmount}</Price>
                            </WithLoadingIndicator>
                        </div>
                    );
                })}
            </div>
            {!lifetimePlan && (
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

interface BillingDetailsProps {
    hasSavedPaymentMethods: boolean;
}

function SubscriptionCheckoutInfoBanners(props: {
    trial: boolean;
    hasSavedPaymentMethods: boolean;
    paymentForbiddenReason: SubscriptionCheckForbiddenReason;
    periodEnd: ReactNode;
}) {
    return (
        <div className="w-full">
            {props.trial && !props.hasSavedPaymentMethods && props.paymentForbiddenReason.reason && (
                <Banner variant="info" icon={<IcCreditCards />} className="mt-4">
                    {c('Subscription')
                        .jt`To continue your subscription after the free trial ends, add a payment method before ${props.periodEnd}.`}
                </Banner>
            )}
            {!props.trial && props.paymentForbiddenReason.reason === 'already-subscribed' && (
                <Banner variant="info" className="mt-4">{c('Payments')
                    .t`You already have a subscription to this plan.`}</Banner>
            )}
        </div>
    );
}

const SubscriptionCheckoutBillingDate = ({ hasSavedPaymentMethods }: BillingDetailsProps) => {
    const { checkoutUi, subscription, loading, getShouldPassTrial, couponConfig } = usePayments();
    const { planIDs, cycle, currency, checkResult } = checkoutUi;

    if (!subscription) {
        return null;
    }

    const shouldPassIsTrial = getShouldPassTrial(planIDs, cycle, false);
    const trial = isTrial(subscription);
    const lifetimePlan = isLifetimePlanSelected(planIDs);
    const amountDue = checkResult.AmountDue || 0;
    const { isCustomBilling, isScheduledChargedImmediately, isScheduledChargedLater, isScheduled } =
        getCheckoutModifiers(checkResult);
    const hasValidCoupon = checkResult.Coupon?.Code || checkResult.Gift;
    const renewalTime = getRenewalTime(
        subscription,
        cycle,
        isCustomBilling,
        isScheduledChargedLater,
        isScheduledChargedImmediately
    );
    const paymentForbiddenReason = isSubscriptionCheckForbiddenWithReason(subscription, planIDs, cycle);
    const totalAmount = checkoutGetNetTotalAmount(checkoutUi, shouldPassIsTrial, couponConfig);

    const amountDueToday = (
        <Price currency={currency} key="amount-due-today">
            {amountDue}
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

    if (lifetimePlan) {
        return (
            <div className="w-full p-4">
                <div className="flex flex-column gap-2">
                    <div className="flex flex-column">
                        <div className="flex justify-space-between text-semibold">
                            <div className="flex flex-column">
                                <span>{c('Subscription').jt`Total due`}</span>
                                <WithLoadingIndicator loading={loading} className="text-xs">
                                    <VatInclusiveText checkResult={checkResult} />
                                </WithLoadingIndicator>
                            </div>
                            <strong>
                                <WithLoadingIndicator loading={loading}>{amountDueToday}</WithLoadingIndicator>
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
        const trailCycleText = getTrailPeriodText(subscription);
        const amountDueToday = isPeriodEndToday || checkResult?.SubscriptionMode === SubscriptionMode.Regular;
        return (
            <div className="w-full p-4">
                <div className="flex flex-column gap-2 text-semibold">
                    {checkResult?.SubscriptionMode !== SubscriptionMode.Regular && trailCycleText && (
                        <div className="flex justify-space-between">
                            <span>{getSubscriptionStartDate(subscription, trial, isScheduled)}</span>
                            <span>{c('Subscription').jt`${trailCycleText} free`}</span>
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
                                <WithLoadingIndicator loading={loading} className="text-xs">
                                    <VatInclusiveText checkResult={checkResult} />
                                </WithLoadingIndicator>
                            </div>
                        </span>
                        <WithLoadingIndicator loading={loading}>
                            <Price currency={currency}>{amountDueToday ? amountDue : totalAmount}</Price>
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
                {!paymentForbiddenReason.reason && (
                    <div className="flex justify-space-between text-semibold">
                        <div className="inline-flex items-center">
                            <div className="flex flex-column">
                                <span>
                                    {isFreeSubscription(subscription) && !hasValidCoupon
                                        ? getTotalBillingText(cycle, planIDs)
                                        : c('Subscription').jt`Total due today`}
                                </span>
                                <WithLoadingIndicator loading={loading} className="text-xs">
                                    <VatInclusiveText checkResult={checkResult} />
                                </WithLoadingIndicator>
                            </div>
                        </div>
                        <WithLoadingIndicator loading={loading}>
                            <Price currency={currency}>{amountDue}</Price>
                        </WithLoadingIndicator>
                    </div>
                )}
                <div className="flex justify-space-between">
                    {c('Subscription').jt`Next billing date`}
                    <span data-testid="lite:checkout:renewal-date">
                        <WithLoadingIndicator loading={loading}>{renewalTime}</WithLoadingIndicator>
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

const SubscriptionCheckoutProration = () => {
    const { checkoutUi, loading, coupon, couponConfig, subscription, getShouldPassTrial, selectCoupon } = usePayments();
    const { currency, checkResult, couponDiscount, cycle, planIDs } = checkoutUi;
    const { isProration, isCustomBilling } = getCheckoutModifiers(checkResult);
    const proration = checkResult.Proration ?? 0;
    const unusedCredit = checkResult.UnusedCredit ?? 0;
    const credit = checkResult.Credit ?? 0;
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const tax = formatTax(checkResult);

    const hasProration = isProration && proration !== 0;
    const isCustomBillingWithCredit = isCustomBilling && unusedCredit < 0;
    const hasAppliedCoupon = !!couponDiscount && !couponConfig?.hidden;
    const hasCredit = credit !== 0;
    const giftValue = Math.abs(checkResult.Gift || 0);
    const showTaxExclusive = tax?.inclusive === TaxInclusive.EXCLUSIVE && tax?.amount > 0;
    const showSubtotal = showTaxExclusive;
    const shouldPassIsTrial = getShouldPassTrial(planIDs, cycle, false);
    const trial = isTrial(subscription);
    const netTotalAmount = checkoutGetNetTotalAmount(checkoutUi, shouldPassIsTrial, couponConfig);
    const paymentForbiddenReason = isSubscriptionCheckForbiddenWithReason(subscription, planIDs, cycle);

    const isSectionVisible =
        hasProration ||
        isCustomBillingWithCredit ||
        hasAppliedCoupon ||
        hasCredit ||
        giftValue ||
        showTaxExclusive ||
        showSubtotal ||
        trial;

    if (!isSectionVisible && !paymentForbiddenReason.reason) {
        return null;
    }

    return (
        <div className="p-4 w-full flex flex-column gap-1 pb-0">
            <div className="flex justify-space-between">
                <span className="inline-flex items-center">
                    <span className="mr-2">{getTotalBillingText(cycle, planIDs)}</span>
                </span>
                <WithLoadingIndicator loading={loading}>
                    <Price currency={currency}>{netTotalAmount}</Price>
                </WithLoadingIndicator>
            </div>
            {hasProration && (
                <div className="flex justify-space-between">
                    <span className="inline-flex items-center">
                        <span className="mr-2">{c('Label').t`Proration`}</span>
                        <Info
                            title={
                                proration < 0
                                    ? c('Info').t`Credit for the unused portion of your previous plan subscription`
                                    : c('Info').t`Balance from your previous subscription`
                            }
                            url={
                                isVPN
                                    ? 'https://protonvpn.com/support/vpn-credit-proration/'
                                    : getKnowledgeBaseUrl('/credit-proration-coupons')
                            }
                        />
                    </span>
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={currency}>{proration}</Price>
                    </WithLoadingIndicator>
                </div>
            )}
            {isCustomBillingWithCredit && (
                <div className="flex justify-space-between">
                    <span className="inline-flex items-center">
                        <span className="mr-2">{c('Label').t`Proration`}</span>
                        <Info
                            title={c('Payments.info')
                                .t`Credit for the unused portion of your previous plan subscription`}
                        />
                    </span>
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={currency}>{unusedCredit}</Price>
                    </WithLoadingIndicator>
                </div>
            )}
            {hasAppliedCoupon && checkResult.Coupon?.Code && (
                <div className="flex justify-space-between">
                    <div className="inline-flex items-center">
                        <div className="flex flex-column gap-0.5">
                            <Badge type="success">
                                <Tooltip title={checkResult.Coupon.Description}>
                                    <div className="flex items-center gap-1">
                                        <IcTagFilled size={3} />
                                        {checkResult.Coupon.Code}
                                    </div>
                                </Tooltip>
                            </Badge>
                        </div>
                    </div>
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={currency}>{couponDiscount}</Price>
                    </WithLoadingIndicator>
                </div>
            )}
            {giftValue > 0 && coupon && (
                <div className="flex justify-space-between">
                    <Badge type="success">
                        <span className="flex items-center gap-1">
                            <IcTagFilled size={3} />
                            {coupon}
                            <IcCross className="cursor-pointer" size={3} onClick={() => selectCoupon('')} />
                        </span>
                    </Badge>
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={currency}>{-giftValue}</Price>
                    </WithLoadingIndicator>
                </div>
            )}
            {hasCredit && (
                <div className={clsx('flex justify-space-between', credit > 0 && 'color-success')}>
                    <span className="inline-flex items-center">
                        <span className="mr-2">
                            {c('Label').t`Your credit balance`} <IcMoneyBills />
                        </span>
                    </span>
                    <WithLoadingIndicator loading={loading}>
                        <Price prefix={credit > 0 ? '+' : ''} currency={currency}>
                            {credit}
                        </Price>
                    </WithLoadingIndicator>
                </div>
            )}
            {showSubtotal && (
                <div className="flex justify-space-between">
                    <span className="inline-flex items-center">
                        <span className="mr-2">{c('Label').t`Net amount`}</span>
                    </span>
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={currency}>{checkoutUi.withDiscountPerCycle}</Price>
                    </WithLoadingIndicator>
                </div>
            )}
            {showTaxExclusive && (
                <div className="flex justify-space-between">
                    <span>
                        {tax.taxesQuantity > 1 ? c('Payments').t`Taxes` : tax.taxName} {tax.rate}%
                    </span>
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={tax.currency}>{tax.amount}</Price>
                    </WithLoadingIndicator>
                </div>
            )}
            <hr className="border-weak border-bottom m-0 mt-3" />
        </div>
    );
};

interface Props {
    hasSavedPaymentMethods: boolean;
}

const SubscriptionCheckoutPlanDetails = ({ hasSavedPaymentMethods }: Props) => {
    const planSectionRef = useRef<HTMLDivElement>(null);
    const [showFixedHeader, setShowFixedHeader] = useState(false);

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

    return (
        <>
            {showFixedHeader && <SubscriptionCheckoutFixedPlanSectionHeader />}
            <section className="flex flex-column border border-weak shadow-raised rounded-lg my-4 lite-app-plan-card">
                <SubscriptionCheckoutPlanPriceSection planSectionRef={planSectionRef} />
                <SubscriptionCheckoutAddonSection />
                <SubscriptionCheckoutProration />
                <SubscriptionCheckoutBillingDate hasSavedPaymentMethods={hasSavedPaymentMethods} />
            </section>
        </>
    );
};

export default SubscriptionCheckoutPlanDetails;
