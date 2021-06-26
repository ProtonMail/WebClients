import React from 'react';
import { c, msgid } from 'ttag';
import { toMap } from 'proton-shared/lib/helpers/object';
import { orderBy } from 'proton-shared/lib/helpers/array';
import { hasBit } from 'proton-shared/lib/helpers/bitset';
import { PLAN_SERVICES, PLAN_TYPES, CYCLE, PLANS, ADDON_NAMES, APPS, BLACK_FRIDAY } from 'proton-shared/lib/constants';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import { getTimeRemaining } from 'proton-shared/lib/date/date';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { Plan, Currency, Cycle, PlanIDs, SubscriptionCheckResponse } from 'proton-shared/lib/interfaces';
import { getAppName } from 'proton-shared/lib/apps/helper';

import { Time, Info } from '../../../components';
import { useConfig } from '../../../hooks';
import { getSubTotal } from './helpers';
import CycleDiscountBadge from '../CycleDiscountBadge';
import DiscountBadge from '../DiscountBadge';
import CheckoutRow from './CheckoutRow';
import Checkout from '../Checkout';
import PaymentGiftCode from '../PaymentGiftCode';

interface Props {
    submit?: React.ReactNode;
    loading?: boolean;
    plans?: Plan[];
    checkResult?: Partial<SubscriptionCheckResponse>;
    currency: Currency;
    cycle: Cycle;
    coupon?: string | null;
    gift?: string;
    onChangeCycle: (cycle: Cycle) => void;
    onChangeCurrency: (currency: Currency) => void;
    onChangeGift?: (gift: string) => void;
    planIDs: PlanIDs;
    hideCurrency?: boolean;
    hideCycle?: boolean;
    service: PLAN_SERVICES;
}

const SubscriptionCheckout = ({
    submit = c('Action').t`Pay`,
    plans = [],
    currency,
    cycle,
    coupon,
    gift,
    onChangeCurrency,
    onChangeCycle,
    onChangeGift,
    planIDs,
    checkResult = {},
    loading,
    hideCurrency,
    hideCycle,
    service,
}: Props) => {
    const { APP_NAME } = useConfig();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;
    const mailAppName = getAppName(APPS.PROTONMAIL);
    const vpnAppName = getAppName(APPS.PROTONVPN_SETTINGS);
    const driveAppName = getAppName(APPS.PROTONDRIVE);
    const isUpdating = !!checkResult.Additions; // Additions is present if the user is updating his current configuration by adding add-ons
    const plansMap = toMap(plans);
    const storageAddon = plans.find(({ Name }) => Name === ADDON_NAMES.SPACE);
    const addressAddon = plans.find(({ Name }) => Name === ADDON_NAMES.ADDRESS);
    const domainAddon = plans.find(({ Name }) => Name === ADDON_NAMES.DOMAIN);
    const memberAddon = plans.find(({ Name }) => Name === ADDON_NAMES.MEMBER);
    const vpnAddon = plans.find(({ Name }) => Name === ADDON_NAMES.VPN);
    const { years, months, days } = getTimeRemaining(
        new Date(),
        checkResult.PeriodEnd ? new Date(checkResult.PeriodEnd * 1000) : new Date()
    );
    const monthsWithYears = months + years * 12;
    const countdown = [
        monthsWithYears &&
            c('Countdown unit').ngettext(msgid`${monthsWithYears} month`, `${monthsWithYears} months`, monthsWithYears),
        days && c('Countdown unit').ngettext(msgid`${days} day`, `${days} days`, days),
    ]
        .filter(isTruthy)
        .join(', ');
    const renewalDate = <Time key="renewal-date">{checkResult.PeriodEnd}</Time>;
    const totalLabel = isUpdating ? c('Label').t`Total (${countdown})` : c('Label').t`Total`;
    const getQuantity = (name: PLANS | ADDON_NAMES, quantity: number) => {
        if (isUpdating) {
            return checkResult?.Additions?.[name as ADDON_NAMES] || 0;
        }
        return quantity;
    };
    const subTotal =
        getSubTotal({
            cycle,
            plans,
            plansMap: Object.entries(planIDs).reduce<{ [key: string]: number }>((acc, [planID, quantity]) => {
                const { Name } = plansMap[planID];
                acc[Name] = getQuantity(Name, quantity);
                return acc;
            }, {}),
        }) / cycle;

    const total = isUpdating
        ? (checkResult.AmountDue || 0) - (checkResult.Credit || 0)
        : (checkResult.Amount || 0) + (checkResult.CouponDiscount || 0);
    const monthlyTotal = ((checkResult.Amount || 0) + (checkResult.CouponDiscount || 0)) / cycle;
    const discount = monthlyTotal - subTotal;
    const collection = orderBy(
        Object.entries(planIDs).map(([planID, quantity]) => ({ ...plansMap[planID], quantity })),
        'Type'
    ).reverse(); // We need to reverse because: plan type = 1, addon type = 0
    const hasMailPlan = collection.some(
        ({ Type, Services }) => Type === PLAN_TYPES.PLAN && hasBit(Services, PLAN_SERVICES.MAIL)
    );
    const hasVpnPlan = collection.some(
        ({ Type, Services }) => Type === PLAN_TYPES.PLAN && hasBit(Services, PLAN_SERVICES.VPN)
    );
    const hasVisionary = collection.some(({ Name }) => Name === PLANS.VISIONARY);
    const hasMailPlus = collection.some(({ Name }) => Name === PLANS.PLUS);
    const hasVpnPlus = collection.some(({ Name }) => Name === PLANS.VPNPLUS);

    const getTitle = (planName: ADDON_NAMES | PLANS, quantity: number) => {
        const addresses = quantity * (addressAddon?.MaxAddresses ?? 0);
        const storage = humanSize(quantity * (storageAddon?.MaxSpace ?? 0), 'GB');
        const domains = quantity * (domainAddon?.MaxDomains ?? 0);
        const members = quantity * (memberAddon?.MaxMembers ?? 0);
        const vpn = quantity * (vpnAddon?.MaxVPN ?? 0);
        const result = {
            [ADDON_NAMES.ADDRESS]: c('Addon').ngettext(
                msgid`+ ${addresses} email address`,
                `+ ${addresses} email addresses`,
                addresses
            ),
            [ADDON_NAMES.SPACE]: c('Addon').t`+ ${storage} storage`,
            [ADDON_NAMES.DOMAIN]: c('Addon').ngettext(
                msgid`+ ${domains} custom domain`,
                `+ ${domains} custom domains`,
                domains
            ),
            [ADDON_NAMES.MEMBER]: c('Addon').ngettext(msgid`+ ${members} user`, `+ ${members} users`, members),
            [ADDON_NAMES.VPN]: c('Addon').ngettext(msgid`+ ${vpn} connection`, `+ ${vpn} connections`, vpn),
        }[planName as ADDON_NAMES];
        return result || '';
    };

    const printSummary = (service = PLAN_SERVICES.MAIL) => {
        return collection
            .filter(({ Services, quantity }) => hasBit(Services, service) && quantity)
            .map(({ ID, Title, Pricing, Type, Name, quantity }) => {
                const update = (isUpdating && checkResult?.Additions?.[Name as ADDON_NAMES]) || 0;
                const diff = quantity - update;
                // translator: Visionary (Mail + VPN)
                const displayTitle = Title === 'Visionary' ? `${Title} ${c('Info').t`(Mail + VPN)`}` : Title;

                return (
                    <React.Fragment key={ID}>
                        {diff ? (
                            <CheckoutRow
                                className={Type === PLAN_TYPES.PLAN ? 'text-bold' : ''}
                                title={
                                    <>
                                        <span className="mr0-5 pr0-5">
                                            {Type === PLAN_TYPES.PLAN ? displayTitle : getTitle(Name, diff)}
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
                                        <span className="mr0-5 pr0-5">{getTitle(Name, update)}</span>
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
                    </React.Fragment>
                );
            });
    };

    return (
        <Checkout
            cycle={cycle}
            currency={currency}
            onChangeCycle={onChangeCycle}
            onChangeCurrency={onChangeCurrency}
            loading={loading}
            hideCurrency={hideCurrency}
            hideCycle={hideCycle}
            service={service}
        >
            {hasMailPlan ? (
                printSummary(PLAN_SERVICES.MAIL)
            ) : (
                <CheckoutRow className="text-bold" title={c('Info').t`${mailAppName} Free`} amount={0} />
            )}
            {hasVisionary ? null : (
                <div className="border-top pt0-5">
                    {hasVpnPlan ? (
                        printSummary(PLAN_SERVICES.VPN)
                    ) : (
                        <CheckoutRow className="text-bold" title={c('Info').t`${vpnAppName} Free`} amount={0} />
                    )}
                </div>
            )}
            {hasVisionary ||
            (hasMailPlus && hasVpnPlus && cycle === CYCLE.TWO_YEARS) ||
            (coupon === BLACK_FRIDAY.COUPON_CODE &&
                hasMailPlus &&
                hasVpnPlus &&
                [CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(cycle)) ? (
                <div className="border-top pt0-5">
                    <CheckoutRow className="text-bold" title={driveAppName} amount={0} />
                </div>
            ) : null}
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
                    <div className="border-bottom mb0-5">
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
                                    <span className="mr0-5">{totalLabel}</span>
                                    {isUpdating ? (
                                        <Info
                                            buttonClass="mb0-5"
                                            title={c('Info')
                                                .jt`Billed at the end of your current billing cycle (renews on ${renewalDate})`}
                                        />
                                    ) : null}
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
