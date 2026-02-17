import type { ReactNode } from 'react';

import { c } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import Badge from '@proton/components/components/badge/Badge';
import Info from '@proton/components/components/link/Info';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import useConfig from '@proton/components/hooks/useConfig';
import { type PaymentFacade, useCurrencies } from '@proton/components/payments/client-extensions';
import type { MethodsHook } from '@proton/components/payments/react-extensions';
import type { CheckoutModifiers, FreeSubscription, SubscriptionCheckForbiddenReason } from '@proton/payments';
import {
    type Currency,
    type Cycle,
    type FreePlanDefault,
    type FullPlansMap,
    type Plan,
    type PlanIDs,
    SelectedPlan,
    type Subscription,
    SubscriptionMode,
    TaxInclusive,
    formatTax,
    getPlanFromPlanIDs,
    hasPlanIDs,
    isFreeSubscription,
    isLifetimePlanSelected,
} from '@proton/payments';
import { type RequiredCheckResponse, getCheckoutUi } from '@proton/payments/core/checkout';
import type { TaxCountryHook } from '@proton/payments/ui';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { UserModel, VPNServersCountData } from '@proton/shared/lib/interfaces';

import Checkout from '../../Checkout';
import { getCheckoutRenewNoticeTextFromCheckResult } from '../../RenewalNotice';
import StartDateCheckoutRow from '../../StartDateCheckoutRow';
import type { CouponConfigRendered } from '../coupon-config/useCouponConfig';
import { getTotalBillingText } from '../helpers';
import { AddonTooltip } from './helpers/AddonTooltip';
import { BilledCycleText } from './helpers/BilledCycleText';
import CheckoutRow from './helpers/CheckoutRow';
import { PlanDescription } from './helpers/PlanDescription';
import { checkoutGetNetTotalAmount } from './helpers/checkoutGetNetTotalAmount';
import { getWhatsIncluded } from './helpers/included';
import { show30DaysMoneyBackGuarantee } from './helpers/show30DaysMoneyBackGuarantee';

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
    subscription: Subscription | FreeSubscription;
    paymentMethods: MethodsHook;
    user: UserModel;
    trial: boolean;
    couponConfig?: CouponConfigRendered;
    paymentFacade: PaymentFacade;
    taxCountry: TaxCountryHook;
    paymentForbiddenReason: SubscriptionCheckForbiddenReason;
};

export const useAvailableCurrenciesForPlan = (
    plan: Plan | undefined,
    subscription: Subscription | FreeSubscription
) => {
    const [user] = useUser();
    const [paymentStatus] = usePaymentStatus();
    const [plansResult] = usePlans();
    const plans: Plan[] = plansResult?.plans ?? [];
    const { getAvailableCurrencies } = useCurrencies();

    return getAvailableCurrencies({
        paymentStatus,
        subscription,
        user,
        plans,
        selectedPlanName: plan?.Name,
    });
};

export type SubscriptionCheckoutProps = Props & CheckoutModifiers;

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
    subscription,
    paymentMethods,
    user,
    trial,
    couponConfig,
    paymentFacade,
    taxCountry,
    paymentForbiddenReason,
    ...checkoutModifiers
}: SubscriptionCheckoutProps) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    const checkout = getCheckoutUi({
        planIDs,
        plansMap,
        checkResult,
    });

    const {
        planTitle,
        usersTitle,
        addons,
        membersPerMonth,
        couponDiscount,
        withDiscountPerMonth,
        withDiscountMembersPerMonth,
        discountTarget,
    } = checkout;

    const plan = getPlanFromPlanIDs(plansMap, planIDs);
    const currencies = useAvailableCurrenciesForPlan(plan, subscription);

    if (!checkResult) {
        return null;
    }

    const isPaidPlanSelected = hasPlanIDs(planIDs);
    const isFreePlanSelected = !isPaidPlanSelected;
    const lifetimePlan = isLifetimePlanSelected(planIDs);

    const proration = checkResult.Proration ?? 0;
    const unusedCredit = checkResult.UnusedCredit ?? 0;
    const credit = checkResult.Credit ?? 0;
    const totalAmount = checkoutGetNetTotalAmount(checkout, trial, couponConfig);
    const amountDue = checkResult.AmountDue || 0;
    const giftValue = Math.abs(checkResult.Gift || 0);

    const list = getWhatsIncluded({ planIDs, plansMap, vpnServers, freePlan });

    const perMonthSuffix = <span className="color-weak text-sm">{c('Suffix').t`/month`}</span>;

    const displayRenewNotice = isPaidPlanSelected && !paymentForbiddenReason.forbidden;

    const tax = formatTax(checkResult);

    const showDiscountBadge =
        !loading &&
        checkout.discountPercent !== 0 &&
        checkResult.SubscriptionMode !== SubscriptionMode.CustomBillings &&
        !trial;

    return (
        <Checkout
            currency={currency}
            currencies={currencies}
            onChangeCurrency={onChangeCurrency}
            loading={loading}
            hasGuarantee={show30DaysMoneyBackGuarantee({
                planIDs,
                plansMap,
                subscription,
                selectedPlan: new SelectedPlan(planIDs, plansMap, cycle, currency),
                paymentForbiddenReason,
            })}
            description={showPlanDescription ? <PlanDescription list={list} /> : null}
            paymentMethods={paymentMethods}
            planIDs={planIDs}
            user={user}
            renewNotice={
                displayRenewNotice
                    ? getCheckoutRenewNoticeTextFromCheckResult({
                          checkResult,
                          plansMap,
                          planIDs,
                          subscription,
                          app: APP_NAME,
                      })
                    : undefined
            }
            couponConfig={couponConfig}
        >
            <div className="mb-4 flex flex-column">
                <div className="min-h-custom" style={{ '--min-h-custom': '1.5rem' }}>
                    <strong className="mb-1">{isFreePlanSelected ? c('Payments.plan_name').t`Free` : planTitle}</strong>
                    {showDiscountBadge ? (
                        <Badge
                            type="success"
                            tooltip={c('Info')
                                .t`Price includes all applicable cycle-based discounts and non-expired coupons saved to your account.`}
                            className="ml-2 text-semibold"
                        >
                            -{checkout.discountPercent}%
                        </Badge>
                    ) : null}
                </div>

                <div className="min-h-custom" style={{ '--min-h-custom': '1.25rem' }}>
                    {isPaidPlanSelected && !lifetimePlan && <BilledCycleText cycle={cycle} planIDs={planIDs} />}
                </div>
            </div>
            {(() => {
                if (lifetimePlan) {
                    return <div className="mb-4">{usersTitle}</div>;
                }

                const noAddonsAndCouponIsHidden = !!couponConfig?.hidden && addons.length === 0;

                let membersAmount: number;
                if (discountTarget === 'base-users') {
                    membersAmount = withDiscountMembersPerMonth;
                } else if (noAddonsAndCouponIsHidden) {
                    membersAmount = withDiscountPerMonth;
                } else {
                    membersAmount = membersPerMonth;
                }

                return (
                    <CheckoutRow
                        title={usersTitle}
                        amount={membersAmount}
                        currency={currency}
                        suffix={perMonthSuffix}
                        loading={loading}
                        data-testid="members-price-per-month"
                    />
                );
            })()}
            {addons.map((addon) => {
                const pricePerAddon = (addon.pricing[cycle] || 0) / cycle;
                const addonAmount = addon.quantity * pricePerAddon;

                return (
                    <CheckoutRow
                        key={addon.name}
                        title={
                            <>
                                {addon.title}
                                <AddonTooltip addon={addon} pricePerAddon={pricePerAddon} currency={currency} />
                            </>
                        }
                        amount={addonAmount}
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
                                {checkoutModifiers.isCustomBilling ? (
                                    <Info
                                        title={c('Payments')
                                            .t`This action expands the existing subscription. You will be charged only for the new add-ons and the remaining time of the current billing cycle. The renewal date of your subscription will not be changed.`}
                                    />
                                ) : null}
                            </>
                        }
                        amount={totalAmount}
                        currency={currency}
                        loading={loading}
                        data-testid="price"
                    />
                </>
            )}

            {checkoutModifiers.isProration && proration !== 0 && (
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
            {checkoutModifiers.isCustomBilling && unusedCredit < 0 && (
                <CheckoutRow
                    title={
                        <span className="inline-flex items-center">
                            <span className="mr-2">{c('Label').t`Proration`}</span>
                            <Info
                                title={c('Payments.info')
                                    .t`Credit for the unused portion of your previous plan subscription`}
                            />
                        </span>
                    }
                    amount={unusedCredit}
                    currency={currency}
                    data-testid="custom-billing-unused-credit-value"
                />
            )}
            {!!couponDiscount && !couponConfig?.hidden && (
                <CheckoutRow
                    title={c('Title').t`Coupon`}
                    amount={couponDiscount}
                    currency={currency}
                    data-testid="coupon-discount"
                />
            )}
            {credit !== 0 && (
                <CheckoutRow
                    title={
                        <span className="inline-flex items-center">
                            <span className="mr-2">{c('Label').t`Credits`}</span>
                            {credit > 0 && <Info title={c('Payments.info').t`Credits will be added to your balance`} />}
                        </span>
                    }
                    amount={credit}
                    currency={currency}
                    data-testid="credits-value"
                />
            )}
            {giftValue > 0 && <CheckoutRow title={c('Title').t`Gift`} amount={-giftValue} currency={currency} />}
            {tax?.inclusive === TaxInclusive.EXCLUSIVE && tax?.amount > 0 && (
                <CheckoutRow
                    title={
                        <span>
                            {tax.taxesQuantity > 1 ? c('Payments').t`Taxes` : tax.taxName} {tax.rate}%
                        </span>
                    }
                    amount={tax.amount}
                    currency={tax.currency}
                />
            )}
            {checkoutModifiers.isScheduled && !isFreeSubscription(subscription) && (
                <StartDateCheckoutRow nextSubscriptionStart={subscription.PeriodEnd} />
            )}
            <hr />
            <CheckoutRow
                title={c('Title').t`Amount due`}
                amount={amountDue}
                currency={currency}
                loading={loading}
                className="text-bold m-0 text-2xl mt-4"
                data-testid="subscription-amout-due"
            />
            {(() => {
                if (!couponConfig?.renderAmountDueMessage) {
                    return null;
                }

                return loading ? (
                    <EllipsisLoader />
                ) : (
                    <div className="mb-4">{couponConfig.renderAmountDueMessage()}</div>
                );
            })()}
            <div className="my-4">{submit}</div>
            {totalAmount > 0 && gift ? gift : null}
        </Checkout>
    );
};

export default SubscriptionCheckout;
