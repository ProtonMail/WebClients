import { ReactNode, useMemo } from 'react';

import { c } from 'ttag';

import { APPS, CYCLE, MEMBER_ADDON_PREFIX, PLANS } from '@proton/shared/lib/constants';
import {
    AddonDescription,
    Included,
    RequiredCheckResponse,
    getCheckout,
    getDiscountText,
    getWhatsIncluded,
} from '@proton/shared/lib/helpers/checkout';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Currency, Cycle, PlanIDs, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';

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
import StartDateCheckoutRow from '../../StartDateCheckoutRow';
import { getTotalBillingText } from '../../helper';
import CheckoutRow from './CheckoutRow';

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
                                    <div className="flex-item-fluid-auto text-ellipsis mr-4">{item.text}</div>
                                    <div className="flex-item-fluid-auto flex-item-noshrink text-right">
                                        {item.value}
                                    </div>
                                </div>
                            );
                        }
                        if (item.type === 'text') {
                            return (
                                <div key={`${item.text}${item.type}`} className="flex flex-nowrap mb-2">
                                    <div className="flex-item-fluid-auto text-ellipsis">{item.text}</div>
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
            case CYCLE.FIFTEEN:
                return c('Subscription').t`Billed every 15 months`;
            case CYCLE.THIRTY:
                return c('Subscription').t`Billed every 30 months`;
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
    if (addon.name.startsWith('1domain')) {
        text = c('Addon').jt`${price} per domain`;
    } else if (addon.name.startsWith(MEMBER_ADDON_PREFIX)) {
        text = c('Addon').jt`${price} per user`;
    } else if (addon.name.startsWith('1ip')) {
        text = c('Addon').jt`${price} per IP address`;
    } else {
        return null;
    }

    return <Info title={text} className="ml-2" />;
};

interface Props {
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
    showProration?: boolean;
    nextSubscriptionStart?: number;
    showDiscount?: boolean;
    enableDetailedAddons?: boolean;
    showPlanDescription?: boolean;
}

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
    checkResult,
    loading,
    showProration = true,
    nextSubscriptionStart,
    showDiscount = true,
    enableDetailedAddons = false,
    showPlanDescription = true,
}: Props) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const {
        planTitle,
        usersTitle,
        discountPercent,
        withDiscountPerCycle,
        addons,
        membersPerMonth,
        withDiscountPerMonth,
    } = getCheckout({
        planIDs,
        plansMap,
        checkResult,
    });

    if (!checkResult) {
        return null;
    }

    const isFreePlanSelected = !hasPlanIDs(planIDs);
    const isVPNPlanSelected = !!planIDs?.[PLANS.VPN] || !!planIDs?.[PLANS.VPN_PRO] || !!planIDs?.[PLANS.VPN_BUSINESS];

    const proration = checkResult.Proration ?? 0;
    const credit = checkResult.Credit ?? 0;
    const amount = checkResult.Amount || 0;
    const amountDue = checkResult.AmountDue || 0;
    const giftValue = Math.abs(checkResult.Gift || 0);

    const list = getWhatsIncluded({ planIDs, plansMap, vpnServers });

    const displayStartDate = !showProration;

    return (
        <Checkout
            currency={currency}
            onChangeCurrency={onChangeCurrency}
            loading={loading}
            hasGuarantee={isVPNPlanSelected}
            hasPayments={!isOptimistic}
            description={showPlanDescription ? <PlanDescription list={list} /> : null}
        >
            <div className="mb-4 flex flex-column">
                <strong className="mb-1">{planTitle}</strong>
                <BilledText cycle={cycle} />
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
                amount={enableDetailedAddons ? membersPerMonth : withDiscountPerMonth}
                currency={currency}
                suffix={<span className="color-weak text-sm">{c('Suffix').t`/month`}</span>}
                suffixNextLine={enableDetailedAddons}
                loading={loading}
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
                    />
                </>
            )}
            {showProration && proration !== 0 && (
                <CheckoutRow
                    title={
                        <span className="inline-flex flex-align-items-center">
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
            {displayStartDate && nextSubscriptionStart && (
                <StartDateCheckoutRow nextSubscriptionStart={nextSubscriptionStart} />
            )}
            {credit !== 0 && <CheckoutRow title={c('Title').t`Credits`} amount={credit} currency={currency} />}
            {giftValue > 0 && <CheckoutRow title={c('Title').t`Gift`} amount={-giftValue} currency={currency} />}
            {!isOptimistic && (
                <>
                    <div className="mb-4">
                        <hr />
                    </div>
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
