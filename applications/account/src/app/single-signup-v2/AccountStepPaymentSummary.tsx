import type { HTMLProps, ReactNode } from 'react';

import { addDays, getUnixTime } from 'date-fns';
import { c, msgid } from 'ttag';

import { Info, Price, Time, getDealDurationText } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { createCheckoutView } from '@proton/payments-ui/ui/headless-checkout/checkout-view';
import { ADDON_PREFIXES, TRIAL_DURATION_DAYS } from '@proton/payments/core/constants';
import type { CouponConfigMetadata } from '@proton/payments/core/coupon-config/interface';
import type { PlanIDs } from '@proton/payments/core/interface';
import { hasAddonFromPlanIDs } from '@proton/payments/core/plan/addons';
import type { Plan } from '@proton/payments/core/plan/interface';
import { SubscriptionMode } from '@proton/payments/core/subscription/constants';
import { type APP_NAMES, LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import RightSummary from './RightSummary';
import SaveLabel from './SaveLabel';
import { getSummaryPlan } from './configuration';
import type { OptimisticOptions, SignupModelV2 } from './interface';

const decorePlanTitle = (selectedPlan: Plan, planIDs: PlanIDs) => {
    const hasLumo = hasAddonFromPlanIDs(ADDON_PREFIXES.LUMO, planIDs ?? {});
    const planTitle = selectedPlan.Title;

    if (!hasLumo) {
        return planTitle;
    }
    return c('Payments').t`${planTitle} + ${LUMO_SHORT_APP_NAME}`;
};

const LoadingWrapper = ({ loading, children }: { loading?: boolean; children: ReactNode }) =>
    loading ? <SkeletonLoader width="4em" index={0} /> : children;

interface CheckoutRowProps extends Omit<HTMLProps<HTMLDivElement>, 'label' | 'value'> {
    label: ReactNode;
    value?: ReactNode;
    valueSuffix?: ReactNode;
    boldLabel?: boolean;
    small?: boolean;
    plainValue?: boolean;
    loading?: boolean;
    labelInfo?: ReactNode;
}

const CheckoutRow = ({
    label,
    value,
    valueSuffix,
    boldLabel,
    small,
    plainValue,
    className,
    loading,
    labelInfo,
    ...others
}: CheckoutRowProps) => (
    <div className={clsx('flex flex-nowrap', className)} {...others}>
        <div
            className={clsx('flex-1', {
                ['text-bold']: boldLabel,
                ['text-sm']: small,
                ['color-weak']: small,
            })}
        >
            {labelInfo ? (
                <>
                    <span className="mr-2">{label}</span>
                    {labelInfo}
                </>
            ) : (
                label
            )}
        </div>
        <div className="text-right">
            {loading ? (
                <SkeletonLoader width="4em" index={0} />
            ) : (
                <>
                    {value && <div className={clsx('text-rg', { ['text-bold']: !plainValue })}>{value}</div>}
                    {valueSuffix && <span className="color-weak ml-1">{valueSuffix}</span>}
                </>
            )}
        </div>
    </div>
);

interface Props {
    model: SignupModelV2;
    options: OptimisticOptions;
    selectedPlan: Plan;
    loadingPaymentDetails: boolean;
    showRenewalNotice: boolean;
    app: APP_NAMES | undefined;
    couponConfig: CouponConfigMetadata | undefined;
}

const AccountStepPaymentSummary = ({
    model,
    selectedPlan,
    options,
    app,
    couponConfig,
    showRenewalNotice,
    loadingPaymentDetails,
}: Props) => {
    const hasCouponCode = !!model.subscriptionData?.checkResult.Coupon?.Code;
    const isTrial = options.checkResult.SubscriptionMode === SubscriptionMode.Trial;
    const loading = model.loadingDependencies || loadingPaymentDetails;

    const summaryPlan = getSummaryPlan({
        app,
        plan: selectedPlan,
        freePlan: model.freePlan,
        existingUser: !!model.session?.resumedSessionResult.UID,
    });

    const checkoutView = createCheckoutView(
        {
            planIDs: hasCouponCode ? model.subscriptionData.planIDs : options.planIDs,
            plansMap: model.plansMap,
            checkResult: hasCouponCode ? model.subscriptionData.checkResult : options.checkResult,
            isTrial,
            couponConfig,
            app,
            subscription: model.session?.subscription,
        },
        ({
            isLifetime,
            isB2C,
            isTaxExclusive,
            hasCredits,
            hasProration,
            hasDiscount,
            checkResult,
            isTaxInclusive,
            hasInvisibleCoupon,
        }) => {
            const hasBreakdown =
                isTaxExclusive || hasCredits || hasProration || (hasDiscount && !hasInvisibleCoupon) || isTrial;
            const isTrialTaxInclusive = isTrial && isTaxInclusive;

            return {
                addons: ({ addons }) =>
                    addons.map((addon) => (
                        <CheckoutRow
                            data-testid={`addons.${addon.addonName}`}
                            key={addon.addonName}
                            label={addon.labelWithQuantity}
                            value={getSimplePriceString(addon.currency, addon.priceForAllPerMonth)}
                            valueSuffix={c('Suffix').t`/month`}
                        />
                    )),
                billingCycle: ({ cycle }) =>
                    !isLifetime && (
                        <div data-testid="billing-cycle" className="color-weak text-ellipsis">
                            {getDealDurationText(cycle)}
                        </div>
                    ),
                planAmount: ({ currency, amount, label }) => {
                    if (isTrialTaxInclusive || !hasBreakdown || hasInvisibleCoupon) {
                        return null;
                    }

                    return (
                        <CheckoutRow
                            data-testid="plan-amount"
                            loading={loading}
                            label={label}
                            value={<Price currency={currency}>{amount}</Price>}
                            boldLabel
                        />
                    );
                },
                discount: (item) => (
                    <>
                        <div className="flex-auto">
                            <LoadingWrapper loading={loading}>
                                <SaveLabel data-testid="discount.label" percent={item.discountPercent} />
                            </LoadingWrapper>
                        </div>
                        {isB2C && (
                            <LoadingWrapper loading={loading}>
                                <span data-testid="discount" className="inline-flex">
                                    <Price className="color-weak text-strike text-ellipsis" currency={item.currency}>
                                        {item.withoutDiscountPerMonth}
                                    </Price>
                                    <span className="color-weak ml-1">{` ${c('Suffix').t`/month`}`}</span>
                                </span>
                            </LoadingWrapper>
                        )}
                    </>
                ),
                planAmountWithDiscount: () => null,
                planAmountWithDiscountPerMonth: ({ currency, planAmountWithDiscountPerMonth }, options) => {
                    const subscriptionMode = checkResult.SubscriptionMode;
                    const showRenewal =
                        options?.hasRenewalDot &&
                        !isTrial &&
                        (subscriptionMode === SubscriptionMode.CustomBillings ||
                            (subscriptionMode === SubscriptionMode.Regular && hasProration));
                    const isFree = isLifetime && planAmountWithDiscountPerMonth === 0;
                    return (
                        <LoadingWrapper loading={loading}>
                            {isFree ? (
                                <div data-testid="plan-amount-with-discount-per-month" className="color-weak">{c('Info')
                                    .t`Free forever`}</div>
                            ) : (
                                <>
                                    <Price data-testid="plan-amount-with-discount-per-month" currency={currency}>
                                        {planAmountWithDiscountPerMonth}
                                    </Price>
                                    {showRenewal && '*'}
                                </>
                            )}
                        </LoadingWrapper>
                    );
                },
                proration: ({ amount, currency }) => (
                    <CheckoutRow
                        plainValue
                        data-testid="proration"
                        label={c('Label').t`Proration`}
                        loading={loading}
                        labelInfo={
                            <Info
                                title={
                                    amount < 0
                                        ? c('Info').t`Credit for the unused portion of your previous plan subscription`
                                        : c('Info').t`Balance from your previous subscription`
                                }
                                url={getKnowledgeBaseUrl('/credit-proration-coupons')}
                            />
                        }
                        value={<Price currency={currency}>{amount}</Price>}
                    />
                ),
                unusedCredit: () => null,
                credit: ({ currency, amount, isAddedToBalance }) => (
                    <CheckoutRow
                        data-testid="credit"
                        plainValue
                        loading={loading}
                        label={c('Label').t`Credits`}
                        labelInfo={
                            isAddedToBalance && (
                                <Info title={c('Payments.info').t`Credits will be added to your balance`} />
                            )
                        }
                        value={<Price currency={currency}>{amount}</Price>}
                    />
                ),
                gift: () => null,
                taxExclusive: ({ taxRateElement, currency, amount }) =>
                    isTaxExclusive && (
                        <CheckoutRow
                            data-testid="tax-exclusive"
                            label={taxRateElement}
                            loading={loading}
                            plainValue
                            value={
                                <Price data-testid="taxAmount" currency={currency}>
                                    {amount}
                                </Price>
                            }
                        />
                    ),
                nextBilling: () => null,
                amountDue: ({ currency, amountDue, label, labelTotalAmount }, options) => {
                    const showDivider = hasBreakdown;
                    const subscriptionMode = checkResult.SubscriptionMode;
                    const showRenewal =
                        options?.hasRenewalDot &&
                        subscriptionMode !== SubscriptionMode.CustomBillings &&
                        !(subscriptionMode === SubscriptionMode.Regular && hasProration);

                    return (
                        <>
                            {hasBreakdown && checkoutView.render('vatReverseCharge')}
                            {showDivider && <hr className="mb-0" />}
                            <CheckoutRow
                                data-testid="amount-due"
                                loading={loading}
                                label={hasBreakdown ? label : labelTotalAmount}
                                value={
                                    <>
                                        <Price currency={currency}>{amountDue}</Price>
                                        {showRenewal && '*'}
                                    </>
                                }
                                boldLabel
                            />
                            {!hasBreakdown && checkoutView.render('vatReverseCharge')}
                        </>
                    );
                },
                taxInclusive: ({ taxRateAndAmountElement }) =>
                    !isTaxExclusive && (
                        <CheckoutRow loading={loading} data-testid="tax" small label={taxRateAndAmountElement} />
                    ),
                renewalNotice: ({ content }) => {
                    return <CheckoutRow loading={loading} data-testid="renewal-notice" label={content} small />;
                },
                coupon: ({ currency, discountAmount }) => (
                    <CheckoutRow
                        data-testid="coupon"
                        loading={loading}
                        label={c('Info').t`Discount`}
                        plainValue
                        value={<Price currency={currency}>{discountAmount}</Price>}
                    />
                ),
                vatReverseCharge: () => (
                    <CheckoutRow
                        data-testid="vat-reverse-charge"
                        small
                        label={c('Payments').t`VAT reverse charge mechanism applies.`}
                    />
                ),
                members: ({ totalUsers: users, currency, pricePerAllPerMonth }) => {
                    if (isB2C) {
                        return null;
                    }

                    return (
                        <CheckoutRow
                            data-testid="members"
                            loading={loading}
                            label={c('Checkout row').ngettext(msgid`${users} user`, `${users} users`, users)}
                            value={getSimplePriceString(currency, pricePerAllPerMonth)}
                            valueSuffix={c('Suffix').t`/month`}
                        />
                    );
                },
                baseRenewAmount: ({ currency, label, baseRenewAmount }) => {
                    const formattedDate = (
                        <Time key="trial-end-date">{getUnixTime(addDays(new Date(), TRIAL_DURATION_DAYS))}</Time>
                    );

                    return (
                        <>
                            <CheckoutRow
                                data-testid="base-renew-amount"
                                label={label}
                                loading={loading}
                                boldLabel
                                value={<Price currency={currency}>{baseRenewAmount}</Price>}
                            />
                            <CheckoutRow
                                loading={loading}
                                data-testid="base-renew-amount.date"
                                small
                                label={c('b2b_trials_2025_Info').jt`on ${formattedDate}`}
                            />
                            <hr className="mb-0" />
                        </>
                    );
                },
            };
        }
    );

    if (!summaryPlan) {
        return null;
    }

    const { logo, features } = summaryPlan;
    const { isB2B, planIDs, isTaxReverseCharged } = checkoutView.checkoutData;

    const displayTitle = decorePlanTitle(selectedPlan, planIDs);

    const hasRenewalDot = checkoutView.getItem('renewalNotice').visible && showRenewalNotice && !isTrial;

    return (
        <RightSummary aria-busy={loading} variant="border" className="mx-auto md:mx-0 rounded-xl">
            {
                /** Add loading element for accessibility and readability */
                loading && <span className="sr-only">{c('Info').t`Loading`}</span>
            }
            <div className="w-full flex flex-nowrap p-6 flex-column gap-4">
                <div className="text-rg text-bold">{c('Info').t`Summary`}</div>
                <div className="flex gap-2 flex-nowrap items-center">
                    <div className="border rounded-lg p-2 right-summary-logo" title={displayTitle}>
                        {logo}
                    </div>
                    <div className="flex-1">
                        <div className="flex gap-2">
                            <div className="text-rg text-bold flex-1">{displayTitle}</div>
                            <div className="text-rg text-bold">
                                {!isB2B && checkoutView.render('planAmountWithDiscountPerMonth', { hasRenewalDot })}
                            </div>
                        </div>
                        <div className="flex flex-1 items-center gap-1 text-sm">
                            {checkoutView.render('billingCycle')}
                            {checkoutView.render('discount')}
                        </div>
                    </div>
                </div>
                {checkoutView.render('members')}
                {checkoutView.render('addons')}
                <PlanCardFeatureList
                    odd={false}
                    margin={false}
                    features={features}
                    icon={false}
                    highlight={false}
                    iconSize={4}
                    tooltip={false}
                    className="text-sm gap-1"
                    itemClassName="color-weak"
                />
                {isB2B && !isTrial && !isTaxReverseCharged && <hr className="mb-0" />}
                <div className="flex flex-nowrap flex-column gap-2">
                    {checkoutView.render('planAmount')}
                    {checkoutView.render('taxExclusive')}
                    {checkoutView.render('proration')}
                    {checkoutView.render('credit')}
                    {checkoutView.render('coupon')}
                    {checkoutView.render('amountDue', { hasRenewalDot })}
                    {checkoutView.render('taxInclusive')}
                    {isTrial && (
                        <>
                            {checkoutView.render('baseRenewAmount')}
                            {checkoutView.render('renewalNotice')}
                        </>
                    )}
                </div>
            </div>
        </RightSummary>
    );
};

export default AccountStepPaymentSummary;
