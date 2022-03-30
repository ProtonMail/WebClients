import { Fragment, ReactNode } from 'react';
import { c, msgid } from 'ttag';
import { toMap } from '@proton/shared/lib/helpers/object';
import { compare } from '@proton/shared/lib/helpers/array';
import {
    ADDON_NAMES,
    APPS,
    BLACK_FRIDAY,
    CYCLE,
    MEMBER_PLAN_MAPPING,
    PLAN_TYPES,
    PLANS,
} from '@proton/shared/lib/constants';
import { getTimeRemaining } from '@proton/shared/lib/date/date';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import {
    Additions,
    Currency,
    Cycle,
    Plan,
    PlanIDs,
    PlansMap,
    SubscriptionCheckResponse,
} from '@proton/shared/lib/interfaces';
import { getAppName } from '@proton/shared/lib/apps/helper';

import { Info, Time } from '../../../components';
import { useConfig } from '../../../hooks';
import CycleDiscountBadge from '../CycleDiscountBadge';
import DiscountBadge from '../DiscountBadge';
import CheckoutRow from './CheckoutRow';
import Checkout from '../Checkout';
import PaymentGiftCode from '../PaymentGiftCode';
import { getSubTotal } from './getSubTotal';

interface Props {
    submit?: ReactNode;
    loading?: boolean;
    plans?: Plan[];
    checkResult?: Partial<SubscriptionCheckResponse>;
    currency: Currency;
    cycle: Cycle;
    coupon?: string | null;
    gift?: string;
    onChangeCurrency: (currency: Currency) => void;
    onChangeGift?: (gift: string) => void;
    planIDs: PlanIDs;
}

const getTotalBillingText = (cycle: Cycle) => {
    if (cycle === CYCLE.MONTHLY) {
        return c('Checkout row').t`Billed monthly`;
    }
    if (cycle === CYCLE.YEARLY) {
        return c('Checkout row').t`Billed annually`;
    }
    if (cycle === CYCLE.TWO_YEARS) {
        return c('Checkout row').t`Billed every 2 years`;
    }
    return '';
};

const getCycleText = (cycle: Cycle) => {
    if (cycle === CYCLE.MONTHLY) {
        return c('Checkout row').t`1 month`;
    }
    if (cycle === CYCLE.YEARLY) {
        return c('Checkout row').t`12 months`;
    }
    if (cycle === CYCLE.TWO_YEARS) {
        return c('Checkout row').t`24 months`;
    }
    return '';
};

const getTitle = (
    planName: PLANS | ADDON_NAMES,
    cycle: Cycle,
    plansMap: PlansMap,
    quantity: number,
    users?: number
) => {
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

    const cycleText = getCycleText(cycle);

    if (users !== undefined && users > 0) {
        return [c('Checkout row').ngettext(msgid`${users} user`, `${users} users`, users), cycleText]
            .filter(isTruthy)
            .join(' - ');
    }

    return cycleText;
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
    const plansWithMemberAddons = Object.values(MEMBER_PLAN_MAPPING);

    const planMap = Object.entries(planIDs).reduce<
        Partial<{ [planName in PLANS | ADDON_NAMES]: Plan & { quantity: number; users?: number } }>
    >((acc, [planNameValue, quantity]) => {
        const planName = planNameValue as keyof PlansMap;
        const plan = plansMap[planName];
        if (!plan || !quantity || quantity <= 0) {
            return acc;
        }
        acc[planName] = {
            ...plan,
            quantity,
            ...(plansWithMemberAddons.includes(planName as any) && { users: plan.MaxMembers }),
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
                //targetPlan.quantity += plan.quantity;
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

    const rows = collection.map(({ ID, Title, Pricing, Type, Name, users, quantity }) => {
        const update = (isUpdating && additions?.[Name as ADDON_NAMES]) || 0;
        const diff = quantity - update;
        // translator: Visionary (Mail + VPN)
        const displayTitle = Title === 'Visionary' ? `${Title} ${c('Info').t`(Mail + VPN)`}` : Title;

        return (
            <Fragment key={ID}>
                {Type === PLAN_TYPES.PLAN && (
                    <div className="mb1">
                        <strong>{displayTitle}</strong>
                    </div>
                )}
                {diff ? (
                    <CheckoutRow
                        title={
                            <>
                                <span className="mr0-5 pr0-5">{getTitle(Name, cycle, plansMap, diff, users)}</span>
                                {!isUpdating && [CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycle) && (
                                    <CycleDiscountBadge cycle={cycle} />
                                )}
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
                                <span className="mr0-5 pr0-5">{getTitle(Name, cycle, plansMap, update, users)}</span>
                                {[CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycle) && (
                                    <CycleDiscountBadge cycle={cycle} />
                                )}
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

const DriveCheckoutRow = ({ planIDs, cycle, coupon }: { planIDs: PlanIDs; cycle: Cycle; coupon?: string | null }) => {
    const driveAppName = getAppName(APPS.PROTONDRIVE);

    const hasVisionary = !!planIDs[PLANS.VISIONARY];
    const hasMailPlus = !!planIDs[PLANS.PLUS];
    const hasVpnPlus = !!planIDs[PLANS.VPNPLUS];

    if (
        hasVisionary ||
        (hasMailPlus && hasVpnPlus && cycle === CYCLE.TWO_YEARS) ||
        (coupon === BLACK_FRIDAY.COUPON_CODE &&
            hasMailPlus &&
            hasVpnPlus &&
            [CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycle))
    ) {
        return (
            <div className="border-top pt0-5">
                <CheckoutRow className="text-bold" title={driveAppName} amount={0} />
            </div>
        );
    }

    return null;
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
            <div className="border-top pt0-5">
                <CheckoutRow
                    className="m0 text-semibold"
                    title={getTotalBillingText(cycle)}
                    amount={subTotal}
                    currency={currency}
                />
            </div>
            <div className="mt1 mb1">{submit}</div>
        </Checkout>
    );
};

const SubscriptionCheckout = ({
    submit = c('Action').t`Pay`,
    plans = [],
    currency,
    cycle,
    coupon,
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

    const getQuantity = (name: PLANS | ADDON_NAMES, quantity: number) => {
        if (isUpdating) {
            return checkResult?.Additions?.[name as ADDON_NAMES] || 0;
        }
        return quantity;
    };
    const plansConfigurationMap = Object.entries(planIDs).reduce<PlanIDs>((acc, [planID, quantity]) => {
        const plan = plansMap[planID as PLANS | ADDON_NAMES];
        if (plan?.Name) {
            acc[plan.Name] = getQuantity(plan.Name, quantity);
        }
        return acc;
    }, {});

    const subTotal = getSubTotal(plansConfigurationMap, plansMap, cycle) / cycle;

    const total = isUpdating
        ? (checkResult.AmountDue || 0) - (checkResult.Credit || 0)
        : (checkResult.Amount || 0) + (checkResult.CouponDiscount || 0);
    const monthlyTotal = ((checkResult.Amount || 0) + (checkResult.CouponDiscount || 0)) / cycle;
    const discount = monthlyTotal - subTotal;

    return (
        <Checkout
            currency={currency}
            onChangeCurrency={onChangeCurrency}
            loading={loading}
            hasGuarantee={!!planIDs[PLANS.VPN]}
        >
            <CheckoutPlanIDs
                planIDs={planIDs}
                plansMap={plansMap}
                currency={currency}
                cycle={cycle}
                isUpdating={isUpdating}
                additions={checkResult?.Additions}
            />
            <DriveCheckoutRow planIDs={planIDs} cycle={cycle} coupon={coupon} />
            {checkResult.Amount ? (
                <>
                    {coupon ? (
                        <div className="border-bottom mb0-5">
                            <CheckoutRow
                                className="m0"
                                title={c('Title').t`Subtotal`}
                                amount={subTotal}
                                currency={currency}
                            />
                            <CheckoutRow
                                title={
                                    <>
                                        <span className="mr0-5">{c('Title').t`Coupon discount`}</span>
                                        <DiscountBadge code={coupon} />
                                    </>
                                }
                                amount={discount}
                                currency={currency}
                                className="text-sm mt0 mb0"
                            />
                        </div>
                    ) : null}
                    <div className="border-top pt0-5">
                        <CheckoutRow
                            className="m0 text-semibold"
                            title={
                                <>
                                    {isUpdating ? (
                                        <TotalPeriodEndTitle PeriodEnd={checkResult?.PeriodEnd} />
                                    ) : (
                                        <span className="mr0-5">{getTotalBillingText(cycle)}</span>
                                    )}
                                </>
                            }
                            amount={total}
                            currency={currency}
                        />
                    </div>
                    {checkResult.Proration || checkResult.Credit || checkResult.Gift ? (
                        <div className="border-bottom mb0-5">
                            {checkResult.Proration ? (
                                <CheckoutRow
                                    title={
                                        <>
                                            <span className="mr0-5">{c('Label').t`Proration`}</span>
                                            <Info
                                                buttonClass="mb0-5"
                                                url={
                                                    isVPN
                                                        ? 'https://protonvpn.com/support/vpn-credit-proration/'
                                                        : 'https://protonmail.com/support/knowledge-base/credit-proration/'
                                                }
                                            />
                                        </>
                                    }
                                    amount={checkResult.Proration}
                                    currency={currency}
                                    className="small mt0 mb0"
                                />
                            ) : null}
                            {checkResult.Credit ? (
                                <CheckoutRow
                                    title={c('Title').t`Credits`}
                                    amount={checkResult.Credit}
                                    currency={currency}
                                    className="small mt0 mb0"
                                />
                            ) : null}
                            {checkResult.Gift ? (
                                <CheckoutRow
                                    title={c('Title').t`Gift code`}
                                    amount={checkResult.Gift}
                                    currency={currency}
                                    className="small mt0 mb0"
                                />
                            ) : null}
                        </div>
                    ) : null}
                </>
            ) : null}
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
