import { Fragment, ReactNode } from 'react';

import { c, msgid } from 'ttag';

import { ADDON_NAMES, APPS, CYCLE, MEMBER_PLAN_MAPPING, PLANS, PLAN_TYPES } from '@proton/shared/lib/constants';
import { getTimeRemaining } from '@proton/shared/lib/date/date';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getCycleDiscount } from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import {
    Additions,
    Currency,
    Cycle,
    Plan,
    PlanIDs,
    PlansMap,
    SubscriptionCheckResponse,
} from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import compare from '@proton/utils/compare';
import isTruthy from '@proton/utils/isTruthy';

import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    Info,
    Time,
} from '../../../components';
import { useConfig } from '../../../hooks';
import Checkout from '../Checkout';
import CycleDiscountBadge from '../CycleDiscountBadge';
import DiscountBadge from '../DiscountBadge';
import PaymentGiftCode from '../PaymentGiftCode';
import { getDueCycleText, getTotalBillingText } from '../helper';
import CheckoutRow from './CheckoutRow';
import { getSubTotal } from './getSubTotal';

interface Props {
    submit?: ReactNode;
    loading?: boolean;
    plans?: Plan[];
    checkResult?: Partial<SubscriptionCheckResponse>;
    currency: Currency;
    cycle: Cycle;
    gift?: string;
    onChangeCurrency: (currency: Currency) => void;
    onChangeGift?: (gift: string) => void;
    planIDs: PlanIDs;
}

const getTitle = (planName: PLANS | ADDON_NAMES, cycle: Cycle, plansMap: PlansMap, quantity: number, users: number) => {
    if (planName.startsWith('1domain')) {
        const addon = plansMap[planName];
        const domains = quantity * (addon?.MaxDomains ?? 0);
        return c('Addon').ngettext(msgid`+ ${domains} custom domain`, `+ ${domains} custom domains`, domains);
    }

    if (planName.startsWith('1member')) {
        const addon = plansMap[planName];
        const users = quantity * (addon?.MaxMembers ?? 0);
        return c('Addon').ngettext(msgid`+ ${users} user`, `+ ${users} users`, users);
    }

    return c('Checkout row').ngettext(msgid`${users} user`, `${users} users`, users);
};

const CheckoutPlanIDs = ({
    planIDs,
    plansMap,
    currency,
    cycle,
    isUpdating,
    additions,
}: {
    planIDs: PlanIDs;
    plansMap: PlansMap;
    currency: Currency;
    cycle: Cycle;
    isUpdating: boolean;
    additions?: Additions | null;
}) => {
    const planMap = Object.entries(planIDs).reduce<
        Partial<{ [planName in PLANS | ADDON_NAMES]: Plan & { quantity: number; users: number } }>
    >((acc, [planNameValue, quantity]) => {
        const planName = planNameValue as keyof PlansMap;
        const plan = plansMap[planName];
        if (!plan || !quantity || quantity <= 0) {
            return acc;
        }
        acc[planName] = {
            ...plan,
            quantity,
            users: plan.MaxMembers || 1, // or 1 for vpnplus
        };
        return acc;
    }, {});

    const mergedPlanMap = Object.entries(planMap).reduce((acc, [planNameValue, plan]) => {
        const planName = planNameValue as keyof PlansMap;
        const planMapping = MEMBER_PLAN_MAPPING[planName as keyof typeof MEMBER_PLAN_MAPPING];
        if (planMapping) {
            delete acc[planName];
            const targetPlan = acc[planMapping];
            if (targetPlan) {
                targetPlan.Pricing = {
                    [CYCLE.MONTHLY]: targetPlan.Pricing[CYCLE.MONTHLY] + plan.Pricing[CYCLE.MONTHLY] * plan.quantity,
                    [CYCLE.YEARLY]: targetPlan.Pricing[CYCLE.YEARLY] + plan.Pricing[CYCLE.YEARLY] * plan.quantity,
                    [CYCLE.TWO_YEARS]:
                        targetPlan.Pricing[CYCLE.TWO_YEARS] + plan.Pricing[CYCLE.TWO_YEARS] * plan.quantity,
                };
                if (targetPlan.users === undefined) {
                    targetPlan.users = targetPlan.MaxMembers;
                }
                targetPlan.users += plan.quantity;
            }
        }
        return acc;
    }, planMap);

    const collection = Object.values(mergedPlanMap)
        .sort((a, b) => {
            const first = compare(a.Type, b.Type);
            // First compare by type, second by the name
            if (first !== 0) {
                return first;
            }
            return a.Name.localeCompare(b.Name);
        })
        .reverse();

    const rows = collection.map(({ ID, Name, Title, Pricing, Type, users, quantity }) => {
        const update = (isUpdating && additions?.[Name as ADDON_NAMES]) || 0;
        const diff = quantity - update;
        // translator: Visionary (Mail + VPN)
        const displayTitle = Title === 'Visionary' ? `${Title} ${c('Info').t`(Mail + VPN)`}` : Title;

        const cycleDiscount = getCycleDiscount(cycle, Name, plansMap);
        const cycleDiscountBadge = cycleDiscount ? <CycleDiscountBadge cycle={cycle} discount={cycleDiscount} /> : null;
        const title = <span className="mr0-5">{getTitle(Name, cycle, plansMap, diff, users)}</span>;

        return (
            <Fragment key={ID}>
                {(diff || update) && Type === PLAN_TYPES.PLAN && (
                    <div className="mb1">
                        <strong>{displayTitle}</strong>
                    </div>
                )}
                {diff ? (
                    <CheckoutRow
                        title={
                            <>
                                {title}
                                {!isUpdating && cycleDiscountBadge}
                            </>
                        }
                        amount={isUpdating ? 0 : (diff * Pricing[cycle]) / cycle}
                        currency={currency}
                        suffix={c('Suffix').t`/month`}
                    />
                ) : null}
                {update ? (
                    <CheckoutRow
                        title={
                            <>
                                {title}
                                {cycleDiscountBadge}
                            </>
                        }
                        amount={(update * Pricing[cycle]) / cycle}
                        currency={currency}
                        suffix={c('Suffix').t`/month`}
                    />
                ) : null}
            </Fragment>
        );
    });

    if (!rows.length) {
        return <CheckoutRow className="text-bold" title={c('Info').t`Free`} amount={0} />;
    }

    return <>{rows}</>;
};

const TotalPeriodEndTitle = ({ PeriodEnd }: { PeriodEnd?: number }) => {
    const { years, months, days } = getTimeRemaining(new Date(), PeriodEnd ? new Date(PeriodEnd * 1000) : new Date());
    const monthsWithYears = months + years * 12;
    const countdown = [
        monthsWithYears &&
            c('Countdown unit').ngettext(msgid`${monthsWithYears} month`, `${monthsWithYears} months`, monthsWithYears),
        days && c('Countdown unit').ngettext(msgid`${days} day`, `${days} days`, days),
    ]
        .filter(isTruthy)
        .join(', ');
    const renewalDate = <Time key="renewal-date">{PeriodEnd}</Time>;

    return (
        <>
            <span className="mr0-5">{c('Label').t`Total (${countdown})`}</span>
            <Info
                buttonClass="mb0-5"
                title={c('Info').jt`Billed at the end of your current billing cycle (renews on ${renewalDate})`}
            />
        </>
    );
};

export const SubscriptionCheckoutLocal = ({
    loading,
    plans,
    currency,
    planIDs,
    cycle,
    onChangeCurrency,
    submit,
}: {
    plans: Plan[];
    loading?: boolean;
    currency: Currency;
    planIDs: PlanIDs;
    cycle: Cycle;
    onChangeCurrency: (currency: Currency) => void;
    submit: ReactNode;
}) => {
    const plansMap = toMap(plans, 'Name');
    const subTotal = getSubTotal(planIDs, plansMap, cycle);
    return (
        <Checkout
            currency={currency}
            onChangeCurrency={onChangeCurrency}
            loading={loading}
            hasGuarantee={!!planIDs[PLANS.VPN]}
            hasPayments={false}
        >
            <CheckoutPlanIDs
                planIDs={planIDs}
                plansMap={plansMap}
                currency={currency}
                cycle={cycle}
                isUpdating={false}
                additions={null}
            />
            <div className="border-top pt1">
                <CheckoutRow
                    className="text-semibold"
                    title={getTotalBillingText(cycle)}
                    amount={subTotal}
                    currency={currency}
                />
            </div>
            <div className="mt1 mb1">{submit}</div>
        </Checkout>
    );
};

const PlanDescription = ({ planIDs, plansMap }: { planIDs: PlanIDs; plansMap: PlansMap }) => {
    const summary = Object.entries(planIDs).reduce(
        (acc, [planNameValue, quantity]) => {
            const planName = planNameValue as keyof PlansMap;
            const plan = plansMap[planName];
            if (!plan || !quantity || quantity <= 0) {
                return acc;
            }
            acc.addresses += plan.MaxAddresses * quantity;
            acc.domains += plan.MaxDomains * quantity;
            acc.space += plan.MaxSpace * quantity;
            acc.vpn += plan.MaxVPN * quantity;
            return acc;
        },
        { space: 0, addresses: 0, domains: 0, vpn: 0 }
    );
    const list = [
        {
            text: c('Info').t`Total storage`,
            value: humanSize(summary.space || FREE_PLAN.MaxSpace, undefined, undefined, 0),
        },
        { text: c('Info').t`Total email addresses`, value: summary.addresses || FREE_PLAN.MaxAddresses },
        { text: c('Info').t`Total supported domains`, value: summary.domains || FREE_PLAN.MaxDomains },
        { text: c('Info').t`Total VPN connections`, value: summary.vpn || FREE_PLAN.MaxVPN },
    ];
    return (
        <div className="mt2">
            <hr />
            <Collapsible>
                <CollapsibleHeader
                    className="text-semibold"
                    suffix={
                        <CollapsibleHeaderIconButton
                            expandText={c('Action').t`What do I get?`}
                            collapseText={c('Action').t`What do I get?`}
                        >
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

const SubscriptionCheckout = ({
    submit = c('Action').t`Pay`,
    plans = [],
    currency,
    cycle,
    gift,
    onChangeCurrency,
    onChangeGift,
    planIDs,
    checkResult = {},
    loading,
}: Props) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const isUpdating = !!checkResult.Additions; // Additions is present if the user is updating his current configuration by adding add-ons
    const plansMap = toMap(plans, 'Name');

    return (
        <Checkout
            currency={currency}
            onChangeCurrency={onChangeCurrency}
            loading={loading}
            hasGuarantee={!!planIDs[PLANS.VPN]}
            description={<PlanDescription planIDs={planIDs} plansMap={plansMap} />}
        >
            <CheckoutPlanIDs
                planIDs={planIDs}
                plansMap={plansMap}
                currency={currency}
                cycle={cycle}
                isUpdating={isUpdating}
                additions={checkResult?.Additions}
            />
            {checkResult.Amount ? (
                <>
                    <div className="mb1">
                        <hr />
                    </div>
                    <CheckoutRow
                        className="text-semibold"
                        title={
                            <>
                                {isUpdating ? (
                                    <TotalPeriodEndTitle PeriodEnd={checkResult?.PeriodEnd} />
                                ) : (
                                    <span className="mr0-5">{getTotalBillingText(cycle)}</span>
                                )}
                            </>
                        }
                        amount={checkResult?.Amount}
                        currency={currency}
                    />
                    {checkResult && checkResult.Coupon?.Code && checkResult.CouponDiscount ? (
                        <>
                            <CheckoutRow
                                title={
                                    <>
                                        <span className="mr0-5">{checkResult.Coupon.Code}</span>
                                        <DiscountBadge
                                            code={checkResult.Coupon.Code}
                                            description={checkResult.Coupon.Description}
                                        >
                                            {`${Math.round(
                                                (Math.abs(checkResult.CouponDiscount) / checkResult.Amount) * 100
                                            )}%`}
                                        </DiscountBadge>
                                    </>
                                }
                                amount={checkResult.CouponDiscount}
                                currency={currency}
                            />
                            <hr />
                            <CheckoutRow
                                className="text-semibold"
                                title={<span className="mr0-5">{getDueCycleText(cycle)}</span>}
                                amount={checkResult.Amount - Math.abs(checkResult.CouponDiscount)}
                                currency={currency}
                            />
                        </>
                    ) : null}
                    {checkResult.Proration || checkResult.Credit || checkResult.Gift ? (
                        <>
                            {checkResult.Proration ? (
                                <CheckoutRow
                                    title={
                                        <>
                                            <span className="mr0-5">{c('Label').t`Proration`}</span>
                                            <Info
                                                buttonClass="mb0-5"
                                                title={c('Info')
                                                    .t`Credit for the unused portion of your previous plan subscription`}
                                                url={
                                                    isVPN
                                                        ? 'https://protonvpn.com/support/vpn-credit-proration/'
                                                        : getKnowledgeBaseUrl('/credit-proration-coupons')
                                                }
                                            />
                                        </>
                                    }
                                    amount={checkResult.Proration}
                                    currency={currency}
                                />
                            ) : null}
                            {checkResult.Credit ? (
                                <CheckoutRow
                                    title={c('Title').t`Credits`}
                                    amount={checkResult.Credit}
                                    currency={currency}
                                />
                            ) : null}
                            {checkResult.Gift ? (
                                <CheckoutRow
                                    title={c('Title').t`Gift code`}
                                    amount={checkResult.Gift}
                                    currency={currency}
                                />
                            ) : null}
                        </>
                    ) : null}
                </>
            ) : null}
            <div className="mb1">
                <hr />
            </div>
            <CheckoutRow
                title={c('Title').t`Amount due`}
                amount={checkResult.AmountDue || 0}
                currency={currency}
                className="text-bold m0 text-2xl"
            />
            <div className="mt1 mb1">{submit}</div>
            {checkResult.Amount && onChangeGift ? (
                <PaymentGiftCode gift={gift} onApply={onChangeGift} loading={loading} />
            ) : null}
        </Checkout>
    );
};

export default SubscriptionCheckout;
