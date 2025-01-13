import type { ReactNode } from 'react';

import { c } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import Badge from '@proton/components/components/badge/Badge';
import Info from '@proton/components/components/link/Info';
import useConfig from '@proton/components/hooks/useConfig';
import { useCurrencies } from '@proton/components/payments/client-extensions';
import { type MethodsHook } from '@proton/components/payments/react-extensions';
import type { FullPlansMap, PaymentMethodStatusExtended, PlanIDs } from '@proton/payments';
import { type Currency, PLANS } from '@proton/payments';
import { APPS } from '@proton/shared/lib/constants';
import type { RequiredCheckResponse } from '@proton/shared/lib/helpers/checkout';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import {
    getPlanFromPlanIDs,
    hasPlanIDs,
    isLifetimePlanSelected,
    planIDsPositiveDifference,
} from '@proton/shared/lib/helpers/planIDs';
import { isSpecialRenewPlan } from '@proton/shared/lib/helpers/renew';
import { getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type {
    Cycle,
    FreePlanDefault,
    Plan,
    SubscriptionModel,
    UserModel,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';

import Checkout from '../../Checkout';
import { getCheckoutRenewNoticeText } from '../../RenewalNotice';
import StartDateCheckoutRow from '../../StartDateCheckoutRow';
import type { OnBillingAddressChange } from '../../TaxCountrySelector';
import { WrappedTaxCountrySelector } from '../../TaxCountrySelector';
import { getTotalBillingText } from '../helpers';
import type { CheckoutModifiers } from '../useCheckoutModifiers';
import { AddonTooltip } from './helpers/AddonTooltip';
import { BilledCycleText } from './helpers/BilledCycleText';
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
    paymentMethods: MethodsHook;
    user: UserModel;
} & CheckoutModifiers;

export const useAvailableCurrenciesForPlan = (plan: Plan | undefined, subscription: SubscriptionModel) => {
    const [user] = useUser();
    const [paymentStatus] = usePaymentStatus();
    const [plansResult] = usePlans();
    const plans: Plan[] = plansResult?.plans ?? [];
    const { getAvailableCurrencies } = useCurrencies();

    return getAvailableCurrencies({
        status: paymentStatus,
        subscription,
        user,
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
    isScheduledChargedImmediately,
    isScheduledChargedLater,
    isProration,
    isCustomBilling,
    paymentNeeded,
    paymentMethods,
    user,
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
    const { planTitle, usersTitle, addons, membersPerMonth, couponDiscount } = checkout;

    const plan = getPlanFromPlanIDs(plansMap, planIDs);
    const currencies = useAvailableCurrenciesForPlan(plan, subscription);

    if (!checkResult) {
        return null;
    }

    const isPaidPlanSelected = hasPlanIDs(planIDs);
    const isFreePlanSelected = !isPaidPlanSelected;
    const lifetimePlan = isLifetimePlanSelected(planIDs);

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
            paymentMethods={paymentMethods}
            planIDs={planIDs}
            user={user}
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
                          isScheduledChargedImmediately,
                          isScheduledChargedLater,
                          isProration,
                          coupon: checkResult.Coupon,
                      })
                    : undefined
            }
        >
            <div className="mb-4 flex flex-column">
                <span className="relative">
                    <strong className="mb-1">{isFreePlanSelected ? c('Payments.plan_name').t`Free` : planTitle}</strong>
                    {discountPercent !== 0 && !loading && (
                        <Badge
                            type="success"
                            tooltip={c('Info')
                                .t`Price includes all applicable cycle-based discounts and non-expired coupons saved to your account.`}
                            className="ml-2 text-semibold absolute"
                        >
                            -{discountPercent}%
                        </Badge>
                    )}
                </span>

                {isPaidPlanSelected && !isSpecialRenewPlan(planIDs) && !lifetimePlan && (
                    <BilledCycleText cycle={cycle} />
                )}
            </div>
            {lifetimePlan ? (
                <div className="mb-4">{usersTitle}</div>
            ) : (
                <CheckoutRow
                    title={usersTitle}
                    amount={membersPerMonth}
                    currency={currency}
                    suffix={perMonthSuffix}
                    loading={loading}
                    data-testid="members-price-per-month"
                />
            )}
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
                                <span className="mr-2">{getTotalBillingText(cycle, planIDs)}</span>
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
            {credit !== 0 && (
                <CheckoutRow
                    title={c('Title').t`Credits`}
                    amount={credit}
                    currency={currency}
                    data-testid="credits-value"
                />
            )}
            {giftValue > 0 && <CheckoutRow title={c('Title').t`Gift`} amount={-giftValue} currency={currency} />}
            {(isScheduledChargedImmediately || isScheduledChargedLater) && (
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
