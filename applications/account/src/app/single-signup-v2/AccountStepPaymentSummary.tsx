import { addDays, getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Info, Price, Time } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import InclusiveVatText from '@proton/components/containers/payments/InclusiveVatText';
import { getCheckoutRenewNoticeTextFromCheckResult } from '@proton/components/containers/payments/RenewalNotice';
import { useCouponConfig } from '@proton/components/containers/payments/subscription/coupon-config/useCouponConfig';
import { getTotalBillingText } from '@proton/components/containers/payments/subscription/helpers';
import {
    COUPON_CODES,
    type Plan,
    getHas2024OfferCoupon,
    getIsB2BAudienceFromPlan,
    isTaxInclusive,
} from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import { getPricingFromPlanIDs, getTotalFromPricing } from '@proton/shared/lib/helpers/planIDs';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { VPNServersCountData } from '@proton/shared/lib/interfaces';
import { SubscriptionMode } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import RightPlanSummary, { RightPlanSummaryAddons } from './RightPlanSummary';
import RightSummary from './RightSummary';
import { getSummaryPlan } from './configuration';
import type { OptimisticOptions, SignupModelV2 } from './interface';

interface Props {
    model: SignupModelV2;
    options: OptimisticOptions;
    selectedPlan: Plan;
    vpnServersCountData: VPNServersCountData;
    loadingPaymentDetails: boolean;
    showRenewalNotice: boolean;
    showInclusiveTax: boolean;
    app: APP_NAMES;
}

const AccountStepPaymentSummary = ({
    model,
    selectedPlan,
    options,
    vpnServersCountData,
    loadingPaymentDetails,
    showRenewalNotice,
    showInclusiveTax,
    app,
}: Props) => {
    const summaryPlan = getSummaryPlan({
        plan: selectedPlan,
        vpnServersCountData,
        freePlan: model.freePlan,
        existingUser: !!model.session?.resumedSessionResult.UID,
    });

    const hasCouponCode = !!model.subscriptionData?.checkResult.Coupon?.Code;
    const currentCheckout = getCheckout({
        // If there is a coupon code, ignore the optimistc results from options since they don't contain the correct discount.
        planIDs: hasCouponCode ? model.subscriptionData.planIDs : options.planIDs,
        plansMap: model.plansMap,
        checkResult: hasCouponCode ? model.subscriptionData.checkResult : options.checkResult,
    });

    const couponConfig = useCouponConfig({
        checkResult: model.subscriptionData.checkResult,
        planIDs: model.subscriptionData.planIDs,
        plansMap: model.plansMap,
    });

    if (!summaryPlan) {
        return null;
    }

    const subscriptionData = model.subscriptionData;

    const proration = subscriptionData.checkResult?.Proration ?? 0;
    const credits = subscriptionData.checkResult?.Credit ?? 0;
    const isBFOffer = getHas2024OfferCoupon(subscriptionData.checkResult?.Coupon?.Code);
    const couponDiscount = isBFOffer || couponConfig?.hidden ? 0 : currentCheckout.couponDiscount || 0;

    const isPorkbun = subscriptionData.checkResult.Coupon?.Code === COUPON_CODES.PORKBUN;
    const hideDiscount = isPorkbun || !!couponConfig?.hidden;

    const isTrial = options.checkResult.SubscriptionMode === SubscriptionMode.Trial;
    const showAmountDue = proration !== 0 || credits !== 0 || couponDiscount !== 0 || hideDiscount || isTrial;

    const isB2BPlan = getIsB2BAudienceFromPlan(selectedPlan.Name);

    const taxInclusiveText = (
        <InclusiveVatText
            tax={options.checkResult?.Taxes?.[0]}
            currency={subscriptionData.currency}
            className="text-sm color-weak"
        />
    );

    const initialLoading = model.loadingDependencies;
    const loading = loadingPaymentDetails || initialLoading;
    const loaderNode = <SkeletonLoader width="4em" index={0} />;

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
                                            {isTrial
                                                ? (options.checkResult.BaseRenewAmount ?? 0)
                                                : currentCheckout.withDiscountPerCycle}
                                        </Price>
                                        {!showAmountDue && showRenewalNotice && '*'}
                                    </>
                                )}
                            </>
                        ) : (
                            <>
                                {getPrice(currentCheckout.regularAmountPerCycle)}
                                {!showAmountDue && showRenewalNotice && '*'}
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
                showInclusiveTax && {
                    id: 'vat',
                    left: taxInclusiveText,
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
                    initialLoading
                        ? loaderNode
                        : getSimplePriceString(
                              options.currency,
                              isTrial
                                  ? (options.checkResult.BaseRenewAmount ?? 0)
                                  : currentCheckout.withDiscountPerMonth
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
                discount={(() => {
                    if (initialLoading) {
                        return 0;
                    }
                    if (isTrial) {
                        // For trials, show the original plan discount instead of the 100% trial discount
                        const pricing = getPricingFromPlanIDs(options.planIDs, model.plansMap);
                        const totals = getTotalFromPricing(pricing, options.cycle);
                        return totals.discountPercentage;
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
                                            {!isTrial && '*'}
                                        </>
                                    )}
                                </span>
                            </div>
                            {isTaxInclusive(options.checkResult) && taxInclusiveText}
                        </>
                    )}
                    {(() => {
                        if (!isTrial) {
                            return null;
                        }

                        const disclaimer = getCheckoutRenewNoticeTextFromCheckResult({
                            checkResult: options.checkResult,
                            plansMap: model.plansMap,
                            planIDs: options.planIDs,
                            subscription: model.session?.subscription,
                            app,
                        });

                        return (
                            <>
                                <div className="flex justify-space-between text-bold text-rg">
                                    <span className="">{c('b2b_trials_2025_Label').t`Amount due after trial`}</span>
                                    <span>
                                        {loading ? (
                                            loaderNode
                                        ) : (
                                            <Price currency={subscriptionData.currency}>
                                                {options.checkResult.BaseRenewAmount ?? 0}
                                            </Price>
                                        )}
                                    </span>
                                </div>
                                <div className="text-sm color-weak">
                                    {(() => {
                                        // hardcoded 14 days, for now. Need to get from BE
                                        const trialEndDate = addDays(new Date(), 14);
                                        const formattedDate = <Time>{getUnixTime(trialEndDate)}</Time>;
                                        return c('b2b_trials_2025_Info').jt`on ${formattedDate}`;
                                    })()}
                                </div>
                                <hr className="m-0" />
                                <div className="text-sm color-weak">{disclaimer}</div>
                            </>
                        );
                    })()}
                    {loading && <span className="sr-only">{c('Info').t`Loading`}</span>}
                </div>
            </RightPlanSummary>
        </RightSummary>
    );
};

export default AccountStepPaymentSummary;
