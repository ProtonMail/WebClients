import { ReactNode } from 'react';

import { c } from 'ttag';

import { APPS, PLANS } from '@proton/shared/lib/constants';
import {
    RequiredCheckResponse,
    getCheckout,
    getDiscountText,
    getWhatsIncluded,
} from '@proton/shared/lib/helpers/checkout';
import { hasPlanIDs } from '@proton/shared/lib/helpers/planIDs';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Currency, Cycle, PlanIDs, PlansMap } from '@proton/shared/lib/interfaces';

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
import { getTotalBillingText } from '../helper';
import CheckoutRow from './CheckoutRow';

const PlanDescription = ({ planIDs, plansMap }: { planIDs: PlanIDs; plansMap: PlansMap }) => {
    const list = getWhatsIncluded({ planIDs, plansMap });
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
                    {list.map((item) => (
                        <div key={item.text} className="flex flex-nowrap mb0-5">
                            <div className="flex-item-fluid-auto text-ellipsis mr1">{item.text}</div>
                            <div className="flex-item-fluid-auto flex-item-noshrink text-right">{item.value}</div>
                        </div>
                    ))}
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};

interface Props {
    submit?: ReactNode;
    loading?: boolean;
    plansMap: PlansMap;
    checkResult: RequiredCheckResponse | undefined;
    currency: Currency;
    cycle: Cycle;
    gift?: ReactNode;
    onChangeCurrency: (currency: Currency) => void;
    planIDs: PlanIDs;
    isOptimistic?: boolean;
}

const SubscriptionCheckout = ({
    submit = c('Action').t`Pay`,
    plansMap,
    currency,
    cycle,
    onChangeCurrency,
    gift,
    isOptimistic,
    planIDs,
    checkResult,
    loading,
}: Props) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const { planTitle, users, discountPercent, withDiscountPerMonth, withDiscountPerCycle, addons } = getCheckout({
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

    return (
        <Checkout
            currency={currency}
            onChangeCurrency={onChangeCurrency}
            loading={loading}
            hasGuarantee={isVPNPlanSelected}
            hasPayments={!isOptimistic}
            description={<PlanDescription planIDs={planIDs} plansMap={plansMap} />}
        >
            <div className="mb1">
                <strong>{planTitle}</strong>
            </div>
            <CheckoutRow
                title={
                    <>
                        {users}
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
            {proration > 0 && (
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
