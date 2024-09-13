import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useCurrencies } from '@proton/components/payments/client-extensions';
import type { FullPlansMap, PaymentMethodStatusExtended } from '@proton/components/payments/core';
import { getAvailableCurrencies } from '@proton/components/payments/core/helpers';
import { APPS, PLANS } from '@proton/shared/lib/constants';
import type { RequiredCheckResponse } from '@proton/shared/lib/helpers/checkout';
import { getCheckout, getDiscountText } from '@proton/shared/lib/helpers/checkout';
import { getPlanFromCheckout, hasPlanIDs, planIDsPositiveDifference } from '@proton/shared/lib/helpers/planIDs';
import { isSpecialRenewPlan } from '@proton/shared/lib/helpers/renew';
import { getHas2023OfferCoupon, getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type {
    Currency,
    Cycle,
    FreePlanDefault,
    Plan,
    PlanIDs,
    SubscriptionModel,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';

import { Badge, Info } from '../../../../components';
import { useConfig, usePaymentStatus, usePlans, useUser } from '../../../../hooks';
import Checkout from '../../Checkout';
import { getBlackFridayRenewalNoticeText, getCheckoutRenewNoticeText } from '../../RenewalNotice';
import StartDateCheckoutRow from '../../StartDateCheckoutRow';
import type { OnBillingAddressChange } from '../../TaxCountrySelector';
import { WrappedTaxCountrySelector } from '../../TaxCountrySelector';
import { getTotalBillingText } from '../../helper';
import type { CheckoutModifiers } from '../useCheckoutModifiers';
import { AddonTooltip } from './helpers/AddonTooltip';
import { BilledText } from './helpers/BilledText';
import CheckoutRow from './helpers/CheckoutRow';
import { PlanDescription } from './helpers/PlanDescription';
import { getWhatsIncluded } from './helpers/included';

type Props = {
    freePlan: FreePlanDefault;
    submit?: ReactNode;
    loading?: boolean;
    planIDs: PlanIDs;
    plansMap: FullPlansMap;
    cycle: Cycle;
    currency: Currency;
    checkResult: RequiredCheckResponse;
    vpnServers: VPNServersCountData;
    gift?: ReactNode;
    onChangeCurrency: (currency: Currency) => void;
    showPlanDescription?: boolean;
    statusExtended?: PaymentMethodStatusExtended;
    showTaxCountry?: boolean;
    onBillingAddressChange?: OnBillingAddressChange;
    subscription: SubscriptionModel;
    paymentNeeded: boolean;
} & CheckoutModifiers;

export const useAvailableCurrenciesForPlan = (plan: Plan | null, subscription: SubscriptionModel) => {
    const [user] = useUser();
    const [paymentStatus] = usePaymentStatus();
    const { dashboardRegionalCurrencyEnabled } = useCurrencies();
    const [plansResult] = usePlans();
    const plans: Plan[] = plansResult?.plans ?? [];

    return getAvailableCurrencies({
        status: paymentStatus,
        subscription,
        user,
        regionalCurrenciesEnabled: dashboardRegionalCurrencyEnabled,
        plans,
        selectedPlanName: plan?.Name,
    });
};

const SubscriptionCheckout = ({
    freePlan,
    submit = c('Action').t`Pay`,
    loading,
    planIDs,
    plansMap,
    cycle,
    currency,
    checkResult,
    vpnServers,
    gift,
    onChangeCurrency,
    showPlanDescription = true,
    statusExtended,
    showTaxCountry,
    onBillingAddressChange,
    subscription,
    isScheduledSubscription,
    isAddonDowngrade,
    isProration,
    isCustomBilling,
    paymentNeeded,
}: Props) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    const planIDsForDiscount = isCustomBilling ? planIDsPositiveDifference(getPlanIDs(subscription), planIDs) : planIDs;
    const { discountPercent } = getCheckout({
        planIDs: planIDsForDiscount,
        plansMap,
        checkResult,
    });

    const checkout = getCheckout({
        planIDs,
        plansMap,
        checkResult,
    });
    const { planTitle, usersTitle, withDiscountPerCycle, addons, membersPerMonth, couponDiscount } = checkout;

    const plan = getPlanFromCheckout(planIDs, plansMap);
    const currencies = useAvailableCurrenciesForPlan(plan, subscription);

    if (!checkResult) {
        return null;
    }

    const isPaidPlanSelected = hasPlanIDs(planIDs);
    const isFreePlanSelected = !isPaidPlanSelected;

    const hasGuarantee =
        !!planIDs?.[PLANS.VPN] ||
        !!planIDs?.[PLANS.VPN_PRO] ||
        !!planIDs?.[PLANS.VPN_BUSINESS] ||
        !!planIDs?.[PLANS.VPN_PASS_BUNDLE];

    const proration = checkResult.Proration ?? 0;
    const credit = checkResult.Credit ?? 0;
    const amount = checkResult.Amount || 0;
    const amountDue = checkResult.AmountDue || 0;
    const giftValue = Math.abs(checkResult.Gift || 0);

    const list = getWhatsIncluded({ planIDs, plansMap, vpnServers, freePlan });

    const hasBFDiscount = getHas2023OfferCoupon(checkResult.Coupon?.Code);

    const perMonthSuffix = <span className="color-weak text-sm">{c('Suffix').t`/month`}</span>;

    const displayRenewNotice = isPaidPlanSelected && paymentNeeded;

    return (
        <Checkout
            currency={currency}
            currencies={currencies}
            onChangeCurrency={onChangeCurrency}
            loading={loading}
            hasGuarantee={hasGuarantee}
            description={showPlanDescription ? <PlanDescription list={list} /> : null}
            hiddenRenewNotice={
                hasBFDiscount && (
                    <div className="color-weak">
                        *{' '}
                        {getBlackFridayRenewalNoticeText({
                            price: withDiscountPerCycle,
                            cycle,
                            plansMap,
                            planIDs,
                            currency,
                        })}
                    </div>
                )
            }
            renewNotice={
                displayRenewNotice
                    ? getCheckoutRenewNoticeText({
                          cycle,
                          plansMap,
                          planIDs,
                          checkout,
                          currency,
                          subscription,
                          isCustomBilling,
                          isScheduledSubscription,
                          isAddonDowngrade,
                          isProration,
                          coupon: checkResult.Coupon,
                      })
                    : undefined
            }
        >
            <div className="mb-4 flex flex-column">
                <span>
                    <strong className="mb-1">{isFreePlanSelected ? c('Payments.plan_name').t`Free` : planTitle}</strong>
                    {discountPercent !== 0 && !loading && (
                        <Badge type="success" tooltip={getDiscountText()} className="ml-2 text-semibold">
                            -{discountPercent}%
                        </Badge>
                    )}
                </span>

                {isPaidPlanSelected && !isSpecialRenewPlan(planIDs) && <BilledText cycle={cycle} />}
            </div>
            <CheckoutRow
                title={usersTitle}
                amount={membersPerMonth}
                currency={currency}
                suffix={perMonthSuffix}
                loading={loading}
                data-testid="price"
            />
            {addons.map((addon) => {
                return (
                    <CheckoutRow
                        key={addon.name}
                        title={
                            <>
                                {addon.title}
                                <AddonTooltip
                                    addon={addon}
                                    pricePerAddon={(addon.pricing[cycle] || 0) / cycle}
                                    currency={currency}
                                />
                            </>
                        }
                        amount={(addon.quantity * (addon.pricing[cycle] || 0)) / cycle}
                        currency={currency}
                        loading={loading}
                        suffix={perMonthSuffix}
                    />
                );
            })}
            {isPaidPlanSelected && (
                <>
                    <div className="mb-4">
                        <hr />
                    </div>
                    <CheckoutRow
                        className="text-semibold"
                        title={
                            <>
                                <span className="mr-2">{getTotalBillingText(cycle)}</span>
                                {/* Commented out until PAY-2179 is resolved */}
                                {/* {isCustomBilling ? (
                                    <Info
                                        title={c('Payments')
                                            .t`This action expands the existing subscription. You will be charged only for the new add-ons and the remaining time of the current billing cycle. The renewal date of your subscription will not be changed.`}
                                    />
                                ) : null} */}
                            </>
                        }
                        amount={amount}
                        currency={currency}
                        loading={loading}
                        data-testid="price"
                        star={hasBFDiscount}
                    />
                </>
            )}
            {!!couponDiscount && (
                <CheckoutRow
                    title={c('Title').t`Coupon`}
                    amount={couponDiscount}
                    currency={currency}
                    data-testid="coupon-discount"
                />
            )}
            {isProration && proration !== 0 && (
                <CheckoutRow
                    title={
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
                    }
                    amount={proration}
                    currency={currency}
                    data-testid="proration-value"
                />
            )}
            {credit !== 0 && <CheckoutRow title={c('Title').t`Credits`} amount={credit} currency={currency} />}
            {giftValue > 0 && <CheckoutRow title={c('Title').t`Gift`} amount={-giftValue} currency={currency} />}
            {(isScheduledSubscription || isAddonDowngrade) && (
                <StartDateCheckoutRow nextSubscriptionStart={subscription.PeriodEnd} />
            )}

            <div className="mb-4">
                <hr />
            </div>
            {showTaxCountry && isPaidPlanSelected && (
                <WrappedTaxCountrySelector
                    statusExtended={statusExtended}
                    onBillingAddressChange={onBillingAddressChange}
                />
            )}
            <CheckoutRow
                title={c('Title').t`Amount due`}
                amount={amountDue}
                currency={currency}
                loading={loading}
                className="text-bold m-0 text-2xl"
                data-testid="subscription-amout-due"
            />

            <div className="my-4">{submit}</div>
            {amount > 0 && gift ? gift : null}
        </Checkout>
    );
};

export default SubscriptionCheckout;
