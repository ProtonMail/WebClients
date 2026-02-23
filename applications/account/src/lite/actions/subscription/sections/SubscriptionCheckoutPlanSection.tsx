import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { Badge } from '@proton/components/components/badge/Badge';
import Info from '@proton/components/components/link/Info';
import Price from '@proton/components/components/price/Price';
import CurrencySelector from '@proton/components/containers/payments/CurrencySelector';
import { AddonTooltip } from '@proton/components/containers/payments/subscription/modal-components/helpers/AddonTooltip';
import useConfig from '@proton/components/hooks/useConfig';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcMoneyBills } from '@proton/icons/icons/IcMoneyBills';
import { IcTagFilled } from '@proton/icons/icons/IcTagFilled';
import type { Currency } from '@proton/payments/core/interface';
import { isSubscriptionCheckForbiddenWithReason } from '@proton/payments/index';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import { createCheckoutView } from '@proton/payments/ui/headless-checkout/checkout-view';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import clsx from '@proton/utils/clsx';

import SubscriptionCheckoutPlanDetails from './plan-section/SubscriptionCheckoutPlanDetails';
import SubscriptionCheckoutPlanMoreInformation from './plan-section/SubscriptionCheckoutPlanMoreInformation';
import WithLoadingIndicator from './shared/WithLoadingIndicator';

interface Props {
    onChangePlan: () => void;
    shouldDisableCurrencySelection: boolean;
    availableCurrencies: readonly Currency[];
    hasSavedPaymentMethods: boolean;
}

const SubscriptionCheckoutPlanSection = ({
    onChangePlan,
    shouldDisableCurrencySelection,
    availableCurrencies,
    hasSavedPaymentMethods,
}: Props) => {
    const {
        checkoutUi,
        checkResult,
        plansMap,
        subscription,
        couponConfig,
        getShouldPassTrial,
        loading,
        coupon,
        selectCoupon,
        selectCurrency,
    } = usePayments();
    const { currency, planIDs, cycle } = checkoutUi;
    const { APP_NAME } = useConfig();
    const paymentForbiddenReason = isSubscriptionCheckForbiddenWithReason(subscription, planIDs, cycle);

    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    const checkoutView = createCheckoutView(
        {
            planIDs,
            plansMap,
            checkResult,
            isTrial: getShouldPassTrial(planIDs, cycle, false),
            couponConfig,
            app: APP_NAME,
            subscription,
            paymentForbiddenReason,
        },
        (headless) => ({
            members: (membersItem) => (
                <div className="flex justify-space-between">
                    {membersItem.labelWithQuantity}
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={membersItem.currency}>
                            {headless.isLifetime ? headless.checkResult.Amount : membersItem.pricePerAllPerMonth}
                        </Price>
                    </WithLoadingIndicator>
                </div>
            ),
            addons: (item) =>
                item.addons.map((addon) => (
                    <div className="flex justify-space-between" key={addon.addonName}>
                        <div>
                            {addon.labelWithQuantity}
                            <AddonTooltip
                                addonName={addon.addonName}
                                pricePerAddon={addon.pricePerOnePerMonth}
                                currency={addon.currency}
                            />
                        </div>
                        <WithLoadingIndicator loading={loading}>
                            <Price currency={addon.currency}>{addon.priceForAllPerMonth}</Price>
                        </WithLoadingIndicator>
                    </div>
                )),
            billingCycle: (item) => <span className="text-sm">{item.normalText}</span>,
            // discount is handled manually
            discount: () => null,
            // nextBilling is handled manually
            nextBilling: () => null,
            amountDue: (item) => (
                <WithLoadingIndicator loading={loading}>
                    <Price currency={item.currency}>{item.amountDue}</Price>
                </WithLoadingIndicator>
            ),
            taxInclusive: (item) => (
                <WithLoadingIndicator loading={loading} className="text-xs">
                    <div className="color-weak text-xs text-normal" data-testid="tax">
                        {item.taxRateAndAmountElement}
                    </div>
                </WithLoadingIndicator>
            ),
            renewalNotice: (item) => (
                <p className="color-weak text-sm m-0" data-testid="checkout:header-renew-notice">
                    {item.content}
                </p>
            ),

            planAmount: (item) => (
                <div className="flex justify-space-between">
                    <span className="inline-flex items-center">
                        <span className="mr-2">{item.label}</span>
                    </span>
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={item.currency}>{item.amount}</Price>
                    </WithLoadingIndicator>
                </div>
            ),

            proration: (item) => (
                <div className="flex justify-space-between">
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
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={item.currency}>{item.amount}</Price>
                    </WithLoadingIndicator>
                </div>
            ),

            unusedCredit: (item) => (
                <div className="flex justify-space-between">
                    <span className="inline-flex items-center">
                        <span className="mr-2">{c('Label').t`Proration`}</span>
                        <Info
                            title={c('Payments.info')
                                .t`Credit for the unused portion of your previous plan subscription`}
                        />
                    </span>
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={item.currency}>{item.amount}</Price>
                    </WithLoadingIndicator>
                </div>
            ),

            coupon: (item) => {
                if (!item.couponCode) {
                    return null;
                }
                return (
                    <div className="flex justify-space-between">
                        <div className="inline-flex items-center">
                            <div className="flex flex-column gap-0.5">
                                <Badge type="success">
                                    <Tooltip title={item.couponDescription}>
                                        <div className="flex items-center gap-1">
                                            <IcTagFilled size={3} />
                                            {item.couponCode}
                                        </div>
                                    </Tooltip>
                                </Badge>
                            </div>
                        </div>
                        <WithLoadingIndicator loading={loading}>
                            <Price currency={item.currency}>{item.discountAmount}</Price>
                        </WithLoadingIndicator>
                    </div>
                );
            },

            gift: (item) => {
                if (!coupon) {
                    return null;
                }
                return (
                    <div className="flex justify-space-between">
                        <Badge type="success">
                            <span className="flex items-center gap-1">
                                <IcTagFilled size={3} />
                                {coupon}
                                <IcCross className="cursor-pointer" size={3} onClick={() => selectCoupon('')} />
                            </span>
                        </Badge>
                        <WithLoadingIndicator loading={loading}>
                            <Price currency={item.currency}>{item.amount}</Price>
                        </WithLoadingIndicator>
                    </div>
                );
            },

            credit: (item) => (
                <div className={clsx('flex justify-space-between', item.isAddedToBalance && 'color-success')}>
                    <span className="inline-flex items-center">
                        <span className="mr-2">
                            {c('Label').t`Your credit balance`} <IcMoneyBills />
                        </span>
                    </span>
                    <WithLoadingIndicator loading={loading}>
                        <Price prefix={item.isAddedToBalance ? '+' : ''} currency={item.currency}>
                            {item.amount}
                        </Price>
                    </WithLoadingIndicator>
                </div>
            ),

            // Don't render discounted subtotal for this UI
            planAmountWithDiscount: () => null,

            taxExclusive: (item) => (
                <div className="flex justify-space-between">
                    <span>{item.taxRateElement}</span>
                    <WithLoadingIndicator loading={loading}>
                        <Price currency={item.currency}>{item.amount}</Price>
                    </WithLoadingIndicator>
                </div>
            ),
        })
    );

    return (
        <>
            <div className="flex align-middle items-center justify-between w-full my-4">
                <div className="flex align-middle items-center flex-1 gap-3 ">
                    <h2 className="text-2xl text-bold">{c('Label').t`Your plan`}</h2>
                    <InlineLinkButton onClick={onChangePlan}>{c('Action').t`Change`}</InlineLinkButton>
                </div>
                <div className="shrink-0">
                    <CurrencySelector
                        currencies={availableCurrencies}
                        currency={currency}
                        onSelect={selectCurrency}
                        mode="select-two"
                        disabled={shouldDisableCurrencySelection}
                        className="h-full ml-auto px-3 color-primary relative interactive-pseudo interactive--no-background border-none"
                    />
                </div>
            </div>
            <SubscriptionCheckoutPlanDetails
                hasSavedPaymentMethods={hasSavedPaymentMethods}
                checkoutView={checkoutView}
                paymentForbiddenReason={paymentForbiddenReason}
            />
            <SubscriptionCheckoutPlanMoreInformation checkoutView={checkoutView} />
        </>
    );
};

export default SubscriptionCheckoutPlanSection;
