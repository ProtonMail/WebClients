import { addDays, getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Info, Price, Time } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { getCheckoutRenewNoticeTextFromCheckResult } from '@proton/components/containers/payments/RenewalNotice';
import type { CouponConfigRendered } from '@proton/components/containers/payments/subscription/coupon-config/useCouponConfig';
import { getTotalBillingText } from '@proton/components/containers/payments/subscription/helpers';
import {
    COUPON_CODES,
    type Plan,
    SubscriptionMode,
    TRIAL_DURATION_DAYS,
    TaxInclusive,
    formatTax,
    getHas2025OfferCoupon,
    getIsB2BAudienceFromPlan,
} from '@proton/payments';
import { getCheckoutUi, getOptimisticCheckout } from '@proton/payments/core/checkout';
import { InclusiveVatText } from '@proton/payments/ui';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import type { SubscriptionData } from '../signup/interfaces';
import RightPlanSummary, { RightPlanSummaryAddons } from './RightPlanSummary';
import RightSummary from './RightSummary';
import { getSummaryPlan } from './configuration';
import type { OptimisticOptions, SignupModelV2 } from './interface';

const TrialSummary = ({
    loading,
    options,
    model,
    app,
    subscriptionData,
}: {
    loading: boolean;
    options: OptimisticOptions;
    model: SignupModelV2;
    app: APP_NAMES;
    subscriptionData: SubscriptionData;
}) => {
    const loaderNode = <SkeletonLoader width="4em" index={0} />;

    const disclaimer = getCheckoutRenewNoticeTextFromCheckResult({
        checkResult: options.checkResult,
        plansMap: model.plansMap,
        planIDs: options.planIDs,
        subscription: model.session?.subscription,
        app,
    });

    const trialEndDate = addDays(new Date(), TRIAL_DURATION_DAYS);
    const formattedDate = <Time key="trial-end-date">{getUnixTime(trialEndDate)}</Time>;

    return (
        <>
            <div className="flex justify-space-between text-bold text-rg">
                <span className="">{c('b2b_trials_2025_Label').t`Amount due after trial`}</span>
                <span>
                    {loading ? (
                        loaderNode
                    ) : (
                        <Price currency={subscriptionData.currency}>{options.checkResult.BaseRenewAmount ?? 0}</Price>
                    )}
                </span>
            </div>
            <div className="text-sm color-weak">{c('b2b_trials_2025_Info').jt`on ${formattedDate}`}</div>
            <hr className="m-0" />
            <div className="text-sm color-weak">{disclaimer}</div>
        </>
    );
};

interface Props {
    model: SignupModelV2;
    options: OptimisticOptions;
    selectedPlan: Plan;
    vpnServersCountData: VPNServersCountData;
    loadingPaymentDetails: boolean;
    showRenewalNotice: boolean;
    app: APP_NAMES;
    couponConfig: CouponConfigRendered | undefined;
}

const AccountStepPaymentSummary = ({
    model,
    selectedPlan,
    options,
    vpnServersCountData,
    loadingPaymentDetails,
    showRenewalNotice,
    app,
    couponConfig,
}: Props) => {
    const summaryPlan = getSummaryPlan({
        plan: selectedPlan,
        vpnServersCountData,
        freePlan: model.freePlan,
        existingUser: !!model.session?.resumedSessionResult.UID,
    });

    const hasCouponCode = !!model.subscriptionData?.checkResult.Coupon?.Code;
    const currentCheckout = getCheckoutUi({
        // If there is a coupon code, ignore the optimistic results from options since they don't contain the correct discount.
        planIDs: hasCouponCode ? model.subscriptionData.planIDs : options.planIDs,
        plansMap: model.plansMap,
        checkResult: hasCouponCode ? model.subscriptionData.checkResult : options.checkResult,
    });

    if (!summaryPlan) {
        return null;
    }

    const subscriptionData = model.subscriptionData;

    const proration = subscriptionData.checkResult?.Proration ?? 0;
    const credits = subscriptionData.checkResult?.Credit ?? 0;
    const isBFOffer = getHas2025OfferCoupon(subscriptionData.checkResult?.Coupon?.Code);
    const couponDiscount = isBFOffer || couponConfig?.hidden ? 0 : currentCheckout.couponDiscount || 0;

    const isPorkbun = subscriptionData.checkResult.Coupon?.Code === COUPON_CODES.PORKBUN;
    const hideDiscount = isPorkbun || !!couponConfig?.hidden;

    const isTrial = options.checkResult.SubscriptionMode === SubscriptionMode.Trial;

    const tax = formatTax(options.checkResult);
    const showAmountDue =
        proration !== 0 ||
        credits !== 0 ||
        couponDiscount !== 0 ||
        hideDiscount ||
        isTrial ||
        tax?.inclusive === TaxInclusive.EXCLUSIVE;

    const isB2BPlan = getIsB2BAudienceFromPlan(selectedPlan.Name);

    const taxInclusiveText = <InclusiveVatText checkResult={options.checkResult} className="text-sm color-weak" />;

    const initialLoading = model.loadingDependencies;
    const loading = loadingPaymentDetails || initialLoading;
    const loaderNode = <SkeletonLoader width="4em" index={0} />;

    const asteriskPosition: 'full-price' | 'final-amount' =
        // If it's custom billing then it means that user already has a subscription and buys an addon for it. That's why we
        // want to show asterisk next to the full price instead of the final amount - because that will be the renewal amount.
        options.checkResult.SubscriptionMode === SubscriptionMode.CustomBillings ||
        // If user has an active subscription an changes the plan then it will be Proration/Regular subscription mode.
        // As the result, the Amount Due will be full amount minus proration. In this case, it doesn't make sense to
        // show the asterisk next to the final amount, because the amount due can be significantly lower then the full
        // amount thanks to proration.
        (options.checkResult.SubscriptionMode === SubscriptionMode.Regular && options.checkResult.Proration !== 0)
            ? 'full-price'
            : 'final-amount';

    const priceBreakdown = (() => {
        const getPrice = (price: number) => {
            return <Price currency={subscriptionData.currency}>{price}</Price>;
        };
        return [
            !hideDiscount &&
                !isTrial && {
                    id: 'amount',
                    left: <span>{getTotalBillingText(options.cycle, currentCheckout.planIDs)}</span>,
                    right:
                        isBFOffer || couponConfig?.hidden ? (
                            <>
                                {loading ? (
                                    loaderNode
                                ) : (
                                    <>
                                        <Price currency={subscriptionData.currency}>
                                            {currentCheckout.withDiscountPerCycle}
                                        </Price>
                                        {!showAmountDue &&
                                            showRenewalNotice &&
                                            asteriskPosition === 'final-amount' &&
                                            '*'}
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Even though this section isn't called "Amount Due", we still must show amountDue 
                                here. This is because if we don't show the dedicated "Amount Due" line then 
                                this is the final amount that user will see before paying. 
                                It is **critical** to show the amountDue to the user. */}
                                {showAmountDue
                                    ? getPrice(currentCheckout.regularAmountPerCycle)
                                    : getPrice(currentCheckout.amountDue)}
                                {!showAmountDue && showRenewalNotice && asteriskPosition === 'final-amount' && '*'}
                            </>
                        ),
                    bold: true,
                    loader: !showAmountDue,
                },
            !hideDiscount &&
                couponDiscount !== 0 && {
                    id: 'discount',
                    left: c('Info').t`Discount`,
                    right: getPrice(couponDiscount),
                },
            proration !== 0 && {
                id: 'proration',
                left: (
                    <span className="inline-flex items-center">
                        <span className="mr-2">{c('Label').t`Proration`}</span>
                        <Info
                            title={
                                proration < 0
                                    ? c('Info').t`Credit for the unused portion of your previous plan subscription`
                                    : c('Info').t`Balance from your previous subscription`
                            }
                            url={getKnowledgeBaseUrl('/credit-proration-coupons')}
                        />
                    </span>
                ),
                right: getPrice(proration),
                bold: false,
            },
            credits !== 0 && {
                id: 'credits',
                left: <span>{c('Title').t`Credits`}</span>,
                right: getPrice(credits),
                bold: false,
            },
            !showAmountDue &&
                tax?.inclusive === TaxInclusive.INCLUSIVE &&
                tax.amount > 0 && {
                    id: 'vat',
                    left: taxInclusiveText,
                },
            tax?.inclusive === TaxInclusive.EXCLUSIVE &&
                tax?.amount > 0 && {
                    id: 'vat-exclusive',
                    left: (
                        <span>
                            {tax.taxesQuantity > 1 ? c('Payments').t`Taxes` : tax.taxName} {tax.rate}%
                        </span>
                    ),
                    right: (
                        <Price key="price" currency={tax.currency} data-testid="taxAmount">
                            {tax.amount}
                        </Price>
                    ),
                },
        ]
            .filter(isTruthy)
            .map(({ id, bold, left, right, loader }) => {
                return (
                    <div key={id} className={clsx(bold && 'text-bold', 'flex justify-space-between text-rg')}>
                        {left}
                        <span>
                            {(() => {
                                if (!right) {
                                    return null;
                                }

                                if (loading) {
                                    if (loader) {
                                        return loaderNode;
                                    }
                                    return null;
                                }

                                return right;
                            })()}
                        </span>
                    </div>
                );
            });
    })();

    return (
        <RightSummary variant="border" className="mx-auto md:mx-0 rounded-xl">
            <RightPlanSummary
                cycle={options.cycle}
                summaryPlan={summaryPlan}
                price={
                    initialLoading ? (
                        loaderNode
                    ) : (
                        <>
                            <Price currency={options.currency}>
                                {isTrial
                                    ? (options.checkResult.BaseRenewAmount ?? 0)
                                    : currentCheckout.withDiscountPerMonth}
                            </Price>
                            {asteriskPosition === 'full-price' && '*'}
                        </>
                    )
                }
                regularPrice={
                    initialLoading
                        ? loaderNode
                        : getSimplePriceString(
                              options.currency,
                              isTrial
                                  ? (options.checkResult.BaseRenewAmount ?? 0)
                                  : currentCheckout.withoutDiscountPerMonth
                          )
                }
                addons={
                    <RightPlanSummaryAddons
                        cycle={options.cycle}
                        checkout={currentCheckout}
                        currency={options.currency}
                        displayMembersWithDiscount={hideDiscount}
                    />
                }
                discount={((): number => {
                    if (initialLoading) {
                        return 0;
                    }
                    if (isTrial) {
                        // For trials, show the original plan discount instead of the 100% trial discount
                        return getOptimisticCheckout({
                            planIDs: options.planIDs,
                            plansMap: model.plansMap,
                            currency: options.currency,
                            cycle: options.cycle,
                        }).discountPercent;
                    }

                    return currentCheckout.discountPercent;
                })()}
                checkout={currentCheckout}
                mode={isB2BPlan ? 'addons' : undefined}
                isTrial={isTrial}
            >
                <div className="flex flex-column gap-2">
                    {priceBreakdown}
                    {showAmountDue && (
                        <>
                            {priceBreakdown.length > 0 && <hr className="m-0" />}
                            <div className="flex justify-space-between text-bold text-rg">
                                <span className="">
                                    {isTrial ? c('b2b_trials_2025_Label').t`Amount due now` : c('Label').t`Amount due`}
                                </span>
                                <span>
                                    {loading ? (
                                        loaderNode
                                    ) : (
                                        <>
                                            <Price currency={subscriptionData.currency}>
                                                {options.checkResult.AmountDue}
                                            </Price>
                                            {!isTrial && asteriskPosition === 'final-amount' && '*'}
                                        </>
                                    )}
                                </span>
                            </div>
                            {taxInclusiveText}
                        </>
                    )}
                    {isTrial && (
                        <TrialSummary
                            loading={loading}
                            options={options}
                            model={model}
                            app={app}
                            subscriptionData={subscriptionData}
                        />
                    )}
                    {loading && <span className="sr-only">{c('Info').t`Loading`}</span>}
                </div>
            </RightPlanSummary>
        </RightSummary>
    );
};

export default AccountStepPaymentSummary;
