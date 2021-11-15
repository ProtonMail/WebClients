import { Fragment, ReactNode } from 'react';
import { c, msgid } from 'ttag';
import { toMap } from '@proton/shared/lib/helpers/object';
import { compare } from '@proton/shared/lib/helpers/array';
import { ADDON_NAMES, APPS, BLACK_FRIDAY, CYCLE, PLAN_TYPES, PLANS } from '@proton/shared/lib/constants';
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

import { Badge, Info, Time } from '../../../components';
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

const getTitle = (planName: PLANS | ADDON_NAMES, plansMap: PlansMap, quantity: number) => {
    if (
        [ADDON_NAMES.DOMAIN, ADDON_NAMES.DOMAIN_BUNDLE_PRO, ADDON_NAMES.DOMAIN_ENTERPRISE].includes(
            planName as ADDON_NAMES
        )
    ) {
        const addon = plansMap[planName];
        const domains = quantity * (addon?.MaxDomains ?? 0);
        return c('Addon').ngettext(msgid`+ ${domains} custom domain`, `+ ${domains} custom domains`, domains);
    }

    if (
        [
            ADDON_NAMES.MEMBER,
            ADDON_NAMES.MEMBER_DRIVE_PRO,
            ADDON_NAMES.MEMBER_MAIL_PRO,
            ADDON_NAMES.MEMBER_BUNDLE_PRO,
            ADDON_NAMES.MEMBER_ENTERPRISE,
        ].includes(planName as ADDON_NAMES)
    ) {
        const addon = plansMap[planName];
        const users = quantity * (addon?.MaxMembers ?? 0);
        return c('Addon').ngettext(msgid`+ ${users} user`, `+ ${users} users`, users);
    }

    return '';
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
    const collection = Object.entries(planIDs)
        .map(([planName, quantity]) => {
            const plan = plansMap[planName as keyof PlansMap];
            if (!plan) {
                return;
            }
            return { ...plan, quantity };
        })
        .filter((x): x is Plan & { quantity: number } => !!x && x.quantity > 0)
        .sort((a, b) => {
            const first = compare(a.Type, b.Type);
            // First compare by type, second by the name
            if (first !== 0) {
                return first;
            }
            return a.Name.localeCompare(b.Name);
        })
        .reverse();

    const rows = collection.map(({ ID, Title, Pricing, Type, Name, quantity }) => {
        const update = (isUpdating && additions?.[Name as ADDON_NAMES]) || 0;
        const diff = quantity - update;
        // translator: Visionary (Mail + VPN)
        const displayTitle = Title === 'Visionary' ? `${Title} ${c('Info').t`(Mail + VPN)`}` : Title;

        return (
            <Fragment key={ID}>
                {diff ? (
                    <CheckoutRow
                        className={Type === PLAN_TYPES.PLAN ? 'text-bold' : ''}
                        title={
                            <>
                                <span className="mr0-5 pr0-5">
                                    {Type === PLAN_TYPES.PLAN ? displayTitle : getTitle(Name, plansMap, diff)}
                                </span>
                                {!isUpdating && [CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycle) && (
                                    <span className="text-no-bold">
                                        <CycleDiscountBadge cycle={cycle} />
                                    </span>
                                )}
                            </>
                        }
                        amount={isUpdating ? 0 : (diff * Pricing[cycle]) / cycle}
                        currency={currency}
                    />
                ) : null}
                {update ? (
                    <CheckoutRow
                        title={
                            <>
                                <span className="mr0-5 pr0-5">{getTitle(Name, plansMap, update)}</span>
                                {[CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycle) && (
                                    <span className="text-no-bold">
                                        <CycleDiscountBadge cycle={cycle} />
                                    </span>
                                )}
                            </>
                        }
                        amount={(update * Pricing[cycle]) / cycle}
                        currency={currency}
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
                {[CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycle) ? (
                    <CheckoutRow
                        title={c('Title').t`Total (monthly)`}
                        amount={subTotal / cycle}
                        currency={currency}
                        className="mt0 mb0"
                    />
                ) : null}
                <CheckoutRow className="m0" title={c('Label').t`Total`} amount={subTotal} currency={currency} />
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
    const totalWithoutAnyDiscount = getSubTotal(plansConfigurationMap, plansMap, CYCLE.MONTHLY) / cycle;

    const total = isUpdating
        ? (checkResult.AmountDue || 0) - (checkResult.Credit || 0)
        : (checkResult.Amount || 0) + (checkResult.CouponDiscount || 0);
    const monthlyTotal = ((checkResult.Amount || 0) + (checkResult.CouponDiscount || 0)) / cycle;
    const discount = monthlyTotal - subTotal;
    const totalDiscount = 100 - Math.round((total * 100) / totalWithoutAnyDiscount);

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
                        {[CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycle) ? (
                            <CheckoutRow
                                title={c('Title').t`Total (monthly)`}
                                amount={monthlyTotal}
                                currency={currency}
                                className="mt0 mb0"
                            />
                        ) : null}
                        <CheckoutRow
                            className="m0"
                            title={
                                <>
                                    {isUpdating ? (
                                        <TotalPeriodEndTitle PeriodEnd={checkResult?.PeriodEnd} />
                                    ) : (
                                        <span className="mr0-5">{c('Label').t`Total`}</span>
                                    )}
                                    {!loading && coupon === BLACK_FRIDAY.COUPON_CODE && totalDiscount > 0 && (
                                        <Badge type="success">-{totalDiscount}%</Badge>
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
