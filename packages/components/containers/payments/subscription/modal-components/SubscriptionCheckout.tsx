import { ReactNode, useMemo } from 'react';

import { c } from 'ttag';

import { PaymentMethodStatusExtended } from '@proton/components/payments/core';
import { APPS, CYCLE, PLANS } from '@proton/shared/lib/constants';
import {
    AddonDescription,
    Included,
    RequiredCheckResponse,
    getCheckout,
    getDiscountText,
} from '@proton/shared/lib/helpers/checkout';
import { hasPlanIDs, isDomainAddon, isIpAddon, isMemberAddon } from '@proton/shared/lib/helpers/planIDs';
import { getHas2023OfferCoupon } from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import {
    Currency,
    Cycle,
    FreePlanDefault,
    PlanIDs,
    PlansMap,
    Subscription,
    VPNServersCountData,
} from '@proton/shared/lib/interfaces';

import {
    Badge,
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    Info,
    Price,
} from '../../../../components';
import { useConfig } from '../../../../hooks';
import Checkout from '../../Checkout';
import { getBlackFridayRenewalNoticeText, getCheckoutRenewNoticeText } from '../../RenewalNotice';
import StartDateCheckoutRow from '../../StartDateCheckoutRow';
import { OnBillingAddressChange, WrappedTaxCountrySelector } from '../../TaxCountrySelector';
import { getTotalBillingText } from '../../helper';
import { CheckoutModifiers } from '../useCheckoutModifiers';
import CheckoutRow from './CheckoutRow';
import { getWhatsIncluded } from './included';

const PlanDescription = ({ list }: { list: Included[] }) => {
    return (
        <div className="mt-8">
            <hr />
            <Collapsible>
                <CollapsibleHeader
                    className="text-semibold"
                    suffix={
                        <CollapsibleHeaderIconButton>
                            <Icon name="chevron-down" />
                        </CollapsibleHeaderIconButton>
                    }
                >
                    {c('Action').t`What do I get?`}
                </CollapsibleHeader>
                <CollapsibleContent>
                    {list.map((item) => {
                        if (item.type === 'value') {
                            return (
                                <div key={`${item.text}${item.type}`} className="flex flex-nowrap mb-2">
                                    <div className="flex-auto text-ellipsis mr-4">{item.text}</div>
                                    <div className="flex-auto shrink-0 text-right">{item.value}</div>
                                </div>
                            );
                        }
                        if (item.type === 'text') {
                            return (
                                <div key={`${item.text}${item.type}`} className="flex flex-nowrap mb-2">
                                    <div className="flex-auto text-ellipsis">{item.text}</div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};

const BilledText = ({ cycle }: { cycle: Cycle }) => {
    let text: string = useMemo(() => {
        switch (cycle) {
            case CYCLE.TWO_YEARS:
                return c('Subscription').t`Billed every 2 years`;
            case CYCLE.YEARLY:
                return c('Subscription').t`Billed yearly`;
            case CYCLE.MONTHLY:
                return c('Subscription').t`Billed monthly`;
            case CYCLE.THREE:
                return c('Subscription').t`Billed for 3 months`;
            case CYCLE.FIFTEEN:
                return c('Subscription').t`Billed for 15 months`;
            case CYCLE.EIGHTEEN:
                return c('Subscription').t`Billed for 18 months`;
            case CYCLE.THIRTY:
                return c('Subscription').t`Billed for 30 months`;
        }
    }, [cycle]);

    return <span className="color-weak text-sm">{text}</span>;
};

const AddonTooltip = ({
    addon,
    pricePerAddon,
    currency,
}: {
    addon: AddonDescription;
    pricePerAddon: number;
    currency: Currency;
}) => {
    const price = <Price currency={currency}>{pricePerAddon}</Price>;

    let text: ReactNode;
    if (isDomainAddon(addon.name)) {
        text = c('Addon').jt`${price} per domain`;
    } else if (isMemberAddon(addon.name)) {
        text = c('Addon').jt`${price} per user`;
    } else if (isIpAddon(addon.name)) {
        text = c('Addon').jt`${price} per dedicated server`;
    } else {
        return null;
    }

    return <Info title={text} className="ml-2" />;
};

interface BaseProps {
    freePlan: FreePlanDefault;
    submit?: ReactNode;
    loading?: boolean;
    plansMap: PlansMap;
    vpnServers: VPNServersCountData;
    checkResult: RequiredCheckResponse | undefined;
    currency: Currency;
    cycle: Cycle;
    gift?: ReactNode;
    onChangeCurrency: (currency: Currency) => void;
    planIDs: PlanIDs;
    isOptimistic?: boolean;
    nextSubscriptionStart?: number;
    showDiscount?: boolean;
    enableDetailedAddons?: boolean;
    showPlanDescription?: boolean;
    subscription?: Subscription;
    showTaxCountry?: boolean;
    statusExtended?: PaymentMethodStatusExtended;
    onBillingAddressChange?: OnBillingAddressChange;
}

type Props = BaseProps & CheckoutModifiers;

const SubscriptionCheckout = ({
    submit = c('Action').t`Pay`,
    plansMap,
    vpnServers,
    currency,
    cycle,
    onChangeCurrency,
    gift,
    isOptimistic,
    planIDs,
    freePlan,
    checkResult,
    loading,
    subscription,
    nextSubscriptionStart,
    showDiscount = true,
    enableDetailedAddons = false,
    showPlanDescription = true,
    isScheduledSubscription,
    isProration,
    isCustomBilling,
    showTaxCountry,
    statusExtended,
    onBillingAddressChange,
}: Props) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const checkout = getCheckout({
        planIDs,
        plansMap,
        checkResult,
    });
    const {
        planTitle,
        usersTitle,
        discountPercent,
        withDiscountPerCycle,
        addons,
        membersPerMonth,
        withDiscountPerMonth,
        addonsPerMonth,
    } = checkout;

    if (!checkResult) {
        return null;
    }

    const isFreePlanSelected = !hasPlanIDs(planIDs);
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

    const membersAmount = (() => {
        if (enableDetailedAddons) {
            return membersPerMonth;
        }
        if (isCustomBilling) {
            return membersPerMonth + addonsPerMonth;
        }
        return withDiscountPerMonth;
    })();

    const hasBFDiscount = getHas2023OfferCoupon(checkResult.Coupon?.Code);

    return (
        <Checkout
            currency={currency}
            onChangeCurrency={onChangeCurrency}
            loading={loading}
            hasGuarantee={hasGuarantee}
            hasPayments={!isOptimistic}
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
                !isFreePlanSelected
                    ? getCheckoutRenewNoticeText({
                          cycle,
                          plansMap,
                          planIDs,
                          checkout,
                          currency,
                          subscription,
                          isCustomBilling,
                          isScheduledSubscription,
                          coupon: checkResult.Coupon,
                      })
                    : undefined
            }
        >
            <div className="mb-4 flex flex-column">
                <strong className="mb-1">{isFreePlanSelected ? c('Payments.plan_name').t`Free` : planTitle}</strong>
                {!isFreePlanSelected && <BilledText cycle={cycle} />}
            </div>
            <CheckoutRow
                title={
                    <>
                        {usersTitle}
                        {showDiscount && discountPercent > 0 && (
                            <Badge type="success" tooltip={getDiscountText()} className="ml-2 text-semibold">
                                -{discountPercent}%
                            </Badge>
                        )}
                    </>
                }
                amount={membersAmount}
                currency={currency}
                suffix={<span className="color-weak text-sm">{c('Suffix').t`/month`}</span>}
                suffixNextLine={enableDetailedAddons}
                loading={loading}
                data-testid="price"
            />
            {enableDetailedAddons
                ? addons.map((addon) => {
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
                          />
                      );
                  })
                : addons.map((addon) => {
                      return (
                          <div className="mb-4" key={addon.name}>
                              + {addon.title}
                          </div>
                      );
                  })}
            {!isFreePlanSelected && (
                <>
                    <div className="mb-4">
                        <hr />
                    </div>
                    <CheckoutRow
                        className="text-semibold"
                        title={<span className="mr-2">{getTotalBillingText(cycle)}</span>}
                        amount={withDiscountPerCycle}
                        currency={currency}
                        loading={loading}
                        data-testid="price"
                        star={hasBFDiscount}
                    />
                </>
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
            {isScheduledSubscription && nextSubscriptionStart && (
                <StartDateCheckoutRow nextSubscriptionStart={nextSubscriptionStart} />
            )}
            {credit !== 0 && <CheckoutRow title={c('Title').t`Credits`} amount={credit} currency={currency} />}
            {giftValue > 0 && <CheckoutRow title={c('Title').t`Gift`} amount={-giftValue} currency={currency} />}
            {!isOptimistic && (
                <>
                    <div className="mb-4">
                        <hr />
                    </div>
                    {showTaxCountry && !isFreePlanSelected && (
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
                </>
            )}
            <div className="my-4">{submit}</div>
            {!isOptimistic && amount > 0 && gift ? gift : null}
        </Checkout>
    );
};

export default SubscriptionCheckout;
