import { ReactNode } from 'react';

import { c } from 'ttag';

import { APPS, PLANS } from '@proton/shared/lib/constants';
import {
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
} from '../../../components';
import { useConfig } from '../../../hooks';
import Checkout from '../Checkout';
import StartDateCheckoutRow from '../StartDateCheckoutRow';
import { getTotalBillingText } from '../helper';
import CheckoutRow from './CheckoutRow';

const PlanDescription = ({ list }: { list: Included[] }) => {
    return (
        <div className="mt2">
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
                                <div key={`${item.text}${item.type}`} className="flex flex-nowrap mb0-5">
                                    <div className="flex-item-fluid-auto text-ellipsis mr1">{item.text}</div>
                                    <div className="flex-item-fluid-auto flex-item-noshrink text-right">
                                        {item.value}
                                    </div>
                                </div>
                            );
                        }
                        if (item.type === 'text') {
                            return (
                                <div key={`${item.text}${item.type}`} className="flex flex-nowrap mb0-5">
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
    showProration,
    nextSubscriptionStart,
}: Props) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const { planTitle, usersTitle, discountPercent, withDiscountPerMonth, withDiscountPerCycle, addons } = getCheckout({
        planIDs,
        plansMap,
        checkResult,
    });

    if (!checkResult) {
        return null;
    }

    const isFreePlanSelected = !hasPlanIDs(planIDs);
    const isVPNPlanSelected = !!planIDs?.[PLANS.VPN];

    const proration = Math.abs(checkResult.Proration || 0);
    const credit = Math.abs(checkResult.Credit || 0);
    const amount = checkResult.Amount || 0;
    const amountDue = checkResult.AmountDue || 0;
    const giftValue = Math.abs(checkResult.Gift || 0);

    const list = getWhatsIncluded({ planIDs, plansMap, vpnServers });

    const displayProration = showProration ?? true;
    const displayStartDate = !displayProration;

    return (
        <Checkout
            currency={currency}
            onChangeCurrency={onChangeCurrency}
            loading={loading}
            hasGuarantee={isVPNPlanSelected}
            hasPayments={!isOptimistic}
            description={<PlanDescription list={list} />}
        >
            <div className="mb1">
                <strong>{planTitle}</strong>
            </div>
            <CheckoutRow
                title={
                    <>
                        {usersTitle}
                        {discountPercent > 0 && (
                            <Badge type="success" tooltip={getDiscountText()} className="ml0-5 text-semibold">
                                -{discountPercent}%
                            </Badge>
                        )}
                    </>
                }
                amount={withDiscountPerMonth}
                currency={currency}
                suffix={c('Suffix').t`/month`}
            />
            {addons.map((addon) => {
                return (
                    <div className="mb1" key={addon.name}>
                        {addon.title}
                    </div>
                );
            })}
            {!isFreePlanSelected && (
                <>
                    <div className="mb1">
                        <hr />
                    </div>
                    <CheckoutRow
                        className="text-semibold"
                        title={<span className="mr0-5">{getTotalBillingText(cycle)}</span>}
                        amount={withDiscountPerCycle}
                        currency={currency}
                    />
                </>
            )}
            {displayProration && proration > 0 && (
                <CheckoutRow
                    title={
                        <span className="inline-flex flex-align-items-center">
                            <span className="mr0-5">{c('Label').t`Proration`}</span>
                            <Info
                                title={c('Info').t`Credit for the unused portion of your previous plan subscription`}
                                url={
                                    isVPN
                                        ? 'https://protonvpn.com/support/vpn-credit-proration/'
                                        : getKnowledgeBaseUrl('/credit-proration-coupons')
                                }
                            />
                        </span>
                    }
                    amount={-proration}
                    currency={currency}
                />
            )}
            {displayStartDate && nextSubscriptionStart && (
                <StartDateCheckoutRow nextSubscriptionStart={nextSubscriptionStart} />
            )}
            {credit > 0 && <CheckoutRow title={c('Title').t`Credits`} amount={-credit} currency={currency} />}
            {giftValue > 0 && <CheckoutRow title={c('Title').t`Gift`} amount={-giftValue} currency={currency} />}
            {!isOptimistic && (
                <>
                    <div className="mb1">
                        <hr />
                    </div>
                    <CheckoutRow
                        title={c('Title').t`Amount due`}
                        amount={amountDue}
                        currency={currency}
                        className="text-bold m0 text-2xl"
                    />
                </>
            )}
            <div className="mt1 mb1">{submit}</div>
            {!isOptimistic && amount > 0 && gift ? gift : null}
        </Checkout>
    );
};

export default SubscriptionCheckout;
