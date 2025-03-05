import { c } from 'ttag';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import InclusiveVatText from '@proton/components/containers/payments/InclusiveVatText';
import { getTotalBillingText } from '@proton/components/containers/payments/subscription/helpers';
import { Info, Price } from '@proton/components/index';
import { COUPON_CODES } from '@proton/payments/index';
import { type OnBillingAddressChange, WrappedTaxCountrySelector } from '@proton/payments/ui';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import {
    getHas2024OfferCoupon,
    getIsB2BAudienceFromPlan,
    isTaxInclusive,
} from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Plan, VPNServersCountData } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import RightPlanSummary, { RightPlanSummaryAddons } from './RightPlanSummary';
import RightSummary from './RightSummary';
import SaveLabel from './SaveLabel';
import { getSummaryPlan } from './configuration';
import type { OptimisticOptions, SignupModelV2 } from './interface';

interface Props {
    model: SignupModelV2;
    options: OptimisticOptions;
    selectedPlan: Plan;
    vpnServersCountData: VPNServersCountData;
    loadingPaymentDetails: boolean;
    onBillingAddressChange: OnBillingAddressChange;
    showRenewalNotice: boolean;
    showInclusiveTax: boolean;
    showTaxCountry: boolean;
}

const AccountStepPaymentSummary = ({
    model,
    selectedPlan,
    options,
    vpnServersCountData,
    loadingPaymentDetails,
    onBillingAddressChange,
    showRenewalNotice,
    showInclusiveTax,
    showTaxCountry,
}: Props) => {
    const summaryPlan = getSummaryPlan({ plan: selectedPlan, vpnServersCountData, freePlan: model.freePlan });

    const hasCouponCode = !!model.subscriptionData?.checkResult.Coupon?.Code;
    const currentCheckout = getCheckout({
        // If there is a coupon code, ignore the optimistc results from options since they don't contain the correct discount.
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
    const isBFOffer = getHas2024OfferCoupon(subscriptionData.checkResult?.Coupon?.Code);
    const couponDiscount = isBFOffer ? 0 : currentCheckout.couponDiscount || 0;
    const billingAddress = subscriptionData.billingAddress;

    const isPorkbun = subscriptionData.checkResult.Coupon?.Code === COUPON_CODES.PORKBUN;
    const hideDiscount = isPorkbun;

    const showAmountDue = proration !== 0 || credits !== 0 || couponDiscount !== 0 || hideDiscount;

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
            !hideDiscount && {
                id: 'amount',
                left: <span>{getTotalBillingText(options.cycle, currentCheckout.planIDs)}</span>,
                right: isBFOffer ? (
                    <>
                        {loading ? (
                            loaderNode
                        ) : (
                            <>
                                <Price currency={subscriptionData.currency}>
                                    {currentCheckout.withDiscountPerCycle}
                                </Price>
                                {!showAmountDue && showRenewalNotice && '*'}
                            </>
                        )}
                    </>
                ) : (
                    <>
                        {getPrice(currentCheckout.withoutDiscountPerCycle)}
                        {!showAmountDue && showRenewalNotice && '*'}
                    </>
                ),
                bold: true,
                loader: !showAmountDue,
            },
            !hideDiscount &&
                couponDiscount !== 0 && {
                    id: 'discount',
                    left: (
                        <div>
                            {c('Info').t`Discount`}{' '}
                            <span className="text-sm">
                                <SaveLabel percent={currentCheckout.discountPercent} />
                            </span>
                        </div>
                    ),
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
                        : getSimplePriceString(options.currency, currentCheckout.withDiscountPerMonth)
                }
                regularPrice={
                    initialLoading
                        ? loaderNode
                        : getSimplePriceString(options.currency, currentCheckout.withoutDiscountPerMonth)
                }
                addons={
                    <RightPlanSummaryAddons
                        cycle={options.cycle}
                        checkout={currentCheckout}
                        currency={options.currency}
                        displayMembersWithDiscount={hideDiscount}
                    />
                }
                discount={initialLoading ? 0 : currentCheckout.discountPercent}
                checkout={currentCheckout}
                mode={isB2BPlan ? 'addons' : undefined}
            >
                {!initialLoading && showTaxCountry && (
                    <WrappedTaxCountrySelector
                        className="mb-2"
                        onBillingAddressChange={onBillingAddressChange}
                        statusExtended={
                            // If we are in signup-token mode, then it means that user created an account by clicking "Continue with bitcoin"
                            // It also means that before user created the account, they might changed the billing address.
                            // The account creation re-renders the entire component and resets the user choice. So if we know that this billing address
                            // is rendered after the account creation, then we used the saved user choice from the model.
                            model.signupTokenMode ? billingAddress : model.paymentMethodStatusExtended
                        }
                    />
                )}
                <div className="flex flex-column gap-2">
                    {priceBreakdown}
                    {showAmountDue && (
                        <>
                            {priceBreakdown.length > 0 && <hr className="m-0" />}
                            <div className="flex justify-space-between text-bold text-rg">
                                <span className="">{c('Label').t`Amount due`}</span>
                                <span>
                                    {loading ? (
                                        loaderNode
                                    ) : (
                                        <>
                                            <Price currency={subscriptionData.currency}>
                                                {options.checkResult.AmountDue}
                                            </Price>
                                            *
                                        </>
                                    )}
                                </span>
                            </div>
                            {isTaxInclusive(options.checkResult) && taxInclusiveText}
                        </>
                    )}
                    {loading && <span className="sr-only">{c('Info').t`Loading`}</span>}
                </div>
            </RightPlanSummary>
        </RightSummary>
    );
};

export default AccountStepPaymentSummary;
