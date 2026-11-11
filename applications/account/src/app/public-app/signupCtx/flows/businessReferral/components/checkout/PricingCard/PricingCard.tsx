import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import Price from '@proton/components/components/price/Price';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { usePaymentOptimistic } from '@proton/payments-ui/ui/context/PaymentContextOptimistic';
import { createCheckoutView } from '@proton/payments-ui/ui/headless-checkout/checkout-view';
import { getCountryOptions, getLocalizedCountryByAbbr } from '@proton/payments/core/countries';
import { APPS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { type BusinessReferralPlan, getBusinessReferralPlanConfigs } from '../../../config/planConfigs';
import { PricingFooter } from './PricingFooter';
import { PricingHeader } from './PricingHeader';

export const PricingCard = ({ taxCountryCode }: { taxCountryCode?: string }) => {
    const [{ b2c2b }] = useReferralInfo();
    const referralDiscountPercent = b2c2b.refereeRewardAmount;
    const payments = usePaymentOptimistic();
    const { options, selectedPlan } = payments;

    const countryName = taxCountryCode && getLocalizedCountryByAbbr(taxCountryCode, getCountryOptions());

    const config = getBusinessReferralPlanConfigs().find(
        (config) => config.plan === (selectedPlan.name as BusinessReferralPlan)
    );

    const hasFullCheckoutDetails = payments.initializationStatus.pricingInitialized && !payments.loadingPaymentDetails;

    const checkoutView = useMemo(
        () =>
            createCheckoutView(
                {
                    planIDs: options.planIDs,
                    plansMap: payments.plansMap,
                    checkResult: options.checkResult,
                    app: APPS.PROTONACCOUNT,
                    paymentForbiddenReason: { forbidden: false },
                },
                (headless) => ({
                    members: (item) => {
                        if (!item.visible) {
                            return null;
                        }
                        return (
                            <div className="flex justify-space-between gap-2">
                                <span>{c('Signup').t`Users`}</span>
                                {hasFullCheckoutDetails ? (
                                    <div className="flex flex-column items-end text-right">
                                        <span>
                                            {item.totalUsers} ×{' '}
                                            <Price currency={item.currency}>{item.pricePerOnePerMonth}</Price>
                                        </span>
                                        <span className="text-sm color-weak">{c('Suffix').t`/month`}</span>
                                    </div>
                                ) : (
                                    <SkeletonLoader width="5rem" height="1.25rem" />
                                )}
                            </div>
                        );
                    },
                    addons: ({ addons }) =>
                        addons.map((addon) => (
                            <div key={addon.addonName} className="flex justify-space-between gap-2">
                                <span>{addon.labelWithoutQuantity}</span>
                                {hasFullCheckoutDetails ? (
                                    <div className="flex flex-column items-end text-right">
                                        <span>
                                            {addon.quantity} ×{' '}
                                            <Price currency={addon.currency}>{addon.pricePerOnePerMonth}</Price>
                                        </span>
                                        <span className="text-sm color-weak">{c('Suffix').t`/month`}</span>
                                    </div>
                                ) : (
                                    <SkeletonLoader width="5rem" height="1.25rem" />
                                )}
                            </div>
                        )),
                    planAmount: () => null,
                    // The referral discount, shown as the program's flat percentage (from /referrals/info),
                    // and only when the backend check actually applied a coupon, so it is always part of
                    // `amountDue`. Not rendered through the `coupon` item (which isn't in PricingFooter), nor
                    // the real discount item (its percent drives the "Billed yearly" badge in PricingHeader),
                    // hence `ignoreVisibility`.
                    discount: () => {
                        if (
                            !hasFullCheckoutDetails ||
                            referralDiscountPercent <= 0 ||
                            !options.checkResult.CouponDiscount
                        ) {
                            return null;
                        }
                        return (
                            <div className="flex justify-space-between gap-2">
                                <span>{c('Signup').t`Discount`}</span>
                                <span className="color-success">{`-${referralDiscountPercent}%`}</span>
                            </div>
                        );
                    },
                    proration: () => null,
                    unusedCredit: () => null,
                    coupon: (item) => {
                        if (!item.visible || !hasFullCheckoutDetails) {
                            return null;
                        }
                        return (
                            <div className="flex justify-space-between gap-2">
                                <span>{c('Signup').t`Coupon`}</span>
                                <Price currency={item.currency}>{item.discountAmount}</Price>
                            </div>
                        );
                    },
                    credit: () => null,
                    gift: () => null,
                    planAmountWithDiscount: () => null,
                    // Not rendered as their own rows — their rate/amount text is nested under the
                    // "Total for X months" row instead (see amountDue below), matching the design.
                    taxExclusive: () => null,
                    taxInclusive: () => null,
                    nextBilling: () => null,
                    amountDue: (item, options) => {
                        let totalContent: ReactNode;
                        if (hasFullCheckoutDetails) {
                            totalContent = (
                                <Price key="price" data-testid="totalPrice" currency={item.currency}>
                                    {item.amountDue}
                                </Price>
                            );
                        } else {
                            totalContent = <SkeletonLoader width="6.5rem" height="1.4rem" />;
                        }

                        const isTotalRow = options?.variant === 'total';
                        const taxItem = [headless.items.taxExclusive, headless.items.taxInclusive].find(
                            (item) => item.visible
                        );

                        return (
                            <div className="flex flex-column gap-1">
                                <div className={clsx('flex justify-space-between gap-2', !isTotalRow && 'text-lg')}>
                                    <span className="text-semibold">
                                        {isTotalRow ? item.labelTotalAmount : item.label}
                                    </span>
                                    <span className="text-semibold">{totalContent}</span>
                                </div>
                                {isTotalRow && hasFullCheckoutDetails && taxItem && (
                                    <div className="text-sm color-weak flex flex-column">
                                        <span>{taxItem.taxRateAndAmountElement}</span>
                                        {countryName &&
                                            (() => {
                                                const countryElement = (
                                                    <span key="country" className="text-underline">
                                                        {countryName}
                                                    </span>
                                                );
                                                return <span>{c('Signup').jt`For ${countryElement}`}</span>;
                                            })()}
                                    </div>
                                )}
                            </div>
                        );
                    },
                    renewalNotice: (item) => {
                        if (hasFullCheckoutDetails) {
                            return <div className="text-sm color-weak">{item.content}</div>;
                        }
                    },
                    vatReverseCharge: (item) => {
                        if (hasFullCheckoutDetails) {
                            return <div className="text-sm color-weak mt-2">{item.text}</div>;
                        }
                    },
                    billingCycle: () => null,
                })
            ),
        [
            options.planIDs,
            payments.plansMap,
            options.checkResult,
            hasFullCheckoutDetails,
            referralDiscountPercent,
            countryName,
        ]
    );

    const discountItem = checkoutView.getItem('discount');

    return (
        <section
            className={clsx(
                // ui-prominent: see the same Storefront/getDarkThemes() note in CheckoutForm.tsx —
                // without it, descendants relying on --background-weak (e.g. the dividers below) pick
                // up the light-theme value instead of Storefront's own dark "prominent" surface color.
                'business-card bg-norm ui-prominent w-full flex flex-column border border-weak rounded-xl overflow-hidden'
            )}
        >
            <div className="fade-in w-full flex flex-column p-6">
                <PricingHeader
                    planTitle={selectedPlan.getPlan().Title}
                    icon={config?.icon}
                    discountPercent={
                        hasFullCheckoutDetails && discountItem.visible ? discountItem.discountPercent : undefined
                    }
                />
                <PricingFooter checkoutView={checkoutView} hasFullCheckoutDetails={hasFullCheckoutDetails} />
            </div>
        </section>
    );
};
