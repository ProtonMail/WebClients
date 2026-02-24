import { Fragment, type ReactNode } from 'react';

import { c } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Badge } from '@proton/components/components/badge/Badge';
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
    getPlanFromPlanIDs,
} from '@proton/payments';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { TaxCountryHook } from '@proton/payments/ui';
import { createCheckoutView } from '@proton/payments/ui/headless-checkout/checkout-view';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { UserModel, VPNServersCountData } from '@proton/shared/lib/interfaces';

import Checkout from '../../Checkout';
import StartDateCheckoutRow from '../../StartDateCheckoutRow';
import type { CouponConfigRendered } from '../coupon-config/useCouponConfig';
import { AddonTooltip } from './helpers/AddonTooltip';
import CheckoutRow from './helpers/CheckoutRow';
import { PlanDescription } from './helpers/PlanDescription';
import { getWhatsIncluded } from './helpers/included';
import { show30DaysMoneyBackGuarantee } from './helpers/show30DaysMoneyBackGuarantee';

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

type Props = {
    freePlan: FreePlanDefault;
    submit?: ReactNode;
    loading?: boolean;
    planIDs: PlanIDs;
    plansMap: FullPlansMap;
    cycle: Cycle;
    currency: Currency;
    checkResult: SubscriptionEstimation;
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

    const plan = getPlanFromPlanIDs(plansMap, planIDs);
    const currencies = useAvailableCurrenciesForPlan(plan, subscription);

    if (!checkResult) {
        return null;
    }

    const list = getWhatsIncluded({ planIDs, plansMap, vpnServers, freePlan });

    const perMonthSuffix = <span className="color-weak text-sm">{c('Suffix').t`/month`}</span>;

    const checkoutView = createCheckoutView(
        {
            planIDs,
            plansMap,
            checkResult,
            isTrial: trial,
            couponConfig,
            app: APP_NAME,
            subscription,
            paymentForbiddenReason,
        },
        (headless) => ({
            members: (item) => {
                if (headless.isLifetime) {
                    return <div className="mb-4">{item.labelWithQuantity}</div>;
                }

                return (
                    <CheckoutRow
                        title={item.labelWithQuantity}
                        amount={item.pricePerAllPerMonth}
                        currency={item.currency}
                        suffix={perMonthSuffix}
                        loading={loading}
                        data-testid="members-price-per-month"
                    />
                );
            },

            addons: (item) =>
                item.addons.map((addon) => (
                    <CheckoutRow
                        title={
                            <>
                                {addon.labelWithQuantity}
                                <AddonTooltip
                                    addonName={addon.addonName}
                                    pricePerAddon={addon.pricePerOnePerMonth}
                                    currency={addon.currency}
                                />
                            </>
                        }
                        amount={addon.priceForAllPerMonth}
                        currency={addon.currency}
                        loading={loading}
                        suffix={perMonthSuffix}
                    />
                )),

            planAmount: (item) => (
                <>
                    <div className="mb-4">
                        <hr />
                    </div>
                    <CheckoutRow
                        className="text-semibold"
                        title={
                            <>
                                <span className="mr-2">{item.label}</span>
                                {checkoutModifiers.isCustomBilling ? (
                                    <Info
                                        title={c('Payments')
                                            .t`This action expands the existing subscription. You will be charged only for the new add-ons and the remaining time of the current billing cycle. The renewal date of your subscription will not be changed.`}
                                    />
                                ) : null}
                            </>
                        }
                        amount={item.amount}
                        currency={item.currency}
                        loading={loading}
                        data-testid="price"
                    />
                </>
            ),

            discount: (item) => {
                if (loading) {
                    return null;
                }

                return (
                    <Badge
                        type="success"
                        tooltip={c('Info')
                            .t`Price includes all applicable cycle-based discounts and non-expired coupons saved to your account.`}
                        className="ml-2 text-semibold"
                    >
                        -{item.discountPercent}%
                    </Badge>
                );
            },

            proration: (item) => (
                <CheckoutRow
                    title={
                        <span className="inline-flex items-center">
                            <span className="mr-2">{c('Label').t`Proration`}</span>
                            <Info
                                title={
                                    item.isCredit
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
                    amount={item.amount}
                    currency={item.currency}
                    loading={loading}
                    data-testid="proration-value"
                />
            ),

            unusedCredit: (item) => (
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
                    amount={item.amount}
                    currency={item.currency}
                    loading={loading}
                    data-testid="custom-billing-unused-credit-value"
                />
            ),

            coupon: (item) => (
                <CheckoutRow
                    title={c('Title').t`Coupon`}
                    amount={item.discountAmount}
                    currency={item.currency}
                    loading={loading}
                    data-testid="coupon-discount"
                />
            ),

            credit: (item) => (
                <CheckoutRow
                    title={
                        <span className="inline-flex items-center">
                            <span className="mr-2">{c('Label').t`Credits`}</span>
                            {item.isAddedToBalance && (
                                <Info title={c('Payments.info').t`Credits will be added to your balance`} />
                            )}
                        </span>
                    }
                    amount={item.amount}
                    currency={item.currency}
                    loading={loading}
                    data-testid="credits-value"
                />
            ),

            gift: (item) => (
                <CheckoutRow
                    title={c('Title').t`Gift`}
                    amount={item.amount}
                    currency={item.currency}
                    loading={loading}
                />
            ),

            planAmountWithDiscount: () => null, // Not shown in this checkout variant

            taxExclusive: (item) => (
                <CheckoutRow
                    title={item.taxRateElement}
                    amount={item.amount}
                    currency={item.currency}
                    loading={loading}
                />
            ),

            taxInclusive: (item) => (
                <div className="text-sm color-weak text-center mt-1" data-testid="tax">
                    <span>{item.taxRateAndAmountElement}</span>
                </div>
            ),

            nextBilling: (item) => <StartDateCheckoutRow nextSubscriptionStart={item.scheduledSubscriptionStartDate} />,

            amountDue: (item) => (
                <CheckoutRow
                    title={c('Title').t`Amount due`}
                    amount={item.amountDue}
                    currency={item.currency}
                    loading={loading}
                    className="text-bold m-0 text-2xl mt-4"
                    data-testid="subscription-amout-due"
                />
            ),

            renewalNotice: (item) => item.content,

            billingCycle: (item) => (
                <span className="color-weak text-sm" data-testid="billed-cycle-text">
                    {item.normalText}
                </span>
            ),
        })
    );

    const bodyItems = checkoutView.getVisibleItems({
        exclude: ['amountDue', 'discount', 'renewalNotice', 'taxInclusive', 'billingCycle'],
    });
    const planAmountValue = checkoutView.checkoutData.getItem('planAmount').amount;

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
            renewNotice={checkoutView.render('renewalNotice')}
            couponConfig={couponConfig}
        >
            {/* Plan header: title + discount badge + billing cycle */}
            <div className="mb-4 flex flex-column">
                <div className="min-h-custom" style={{ '--min-h-custom': '1.5rem' }}>
                    <strong className="mb-1">{checkoutView.checkoutData.planTitle}</strong>
                    {checkoutView.render('discount')}
                </div>

                <div className="min-h-custom" style={{ '--min-h-custom': '1.25rem' }}>
                    {checkoutView.render('billingCycle')}
                </div>
            </div>

            {/* Body line items: members, addons, plan-amount, proration, coupon, credit, gift, tax, start-date */}
            {bodyItems.map((item) => (
                <Fragment key={item.type}>{checkoutView.render(item.type)}</Fragment>
            ))}

            {/* Final separator + amount due */}
            <hr />
            {checkoutView.render('amountDue')}

            {/* Coupon amount-due message */}
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

            {/* Submit button */}
            <div className="my-4">
                {submit}
                {checkoutView.render('taxInclusive')}
            </div>

            {/* Gift code input */}
            {planAmountValue > 0 && gift ? gift : null}
        </Checkout>
    );
};

export default SubscriptionCheckout;
