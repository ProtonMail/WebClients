import type { ReactNode } from 'react';

import { c } from 'ttag';

import type { FreeSubscription, PLANS } from '@proton/shared/lib/constants';
import { ADDON_NAMES, CYCLE, DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import { getSupportedAddons, isMemberAddon } from '@proton/shared/lib/helpers/planIDs';
import type { PricingMode, TotalPricing } from '@proton/shared/lib/helpers/subscription';
import { getPlan, getPlanFromIds, getTotals, isTrial } from '@proton/shared/lib/helpers/subscription';
import type {
    Currency,
    PlanIDs,
    PlansMap,
    PriceType,
    Subscription,
    SubscriptionCheckResponse,
} from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { EllipsisLoader, Option, Price, Radio, SelectTwo } from '../../../components';
import InputField from '../../../components/v2/field/InputField';
import { getMonthFreeText } from '../../offers/helpers/offerCopies';
import { getShortBillingText } from '../helper';
import PlanDiscount from './helpers/PlanDiscount';
import PlanPrice from './helpers/PlanPrice';
import { notHigherThanAvailableOnBackend } from './helpers/notHigherThanAvailableOnBackend';

type TotalPricings = {
    [key in CYCLE]: TotalPricing;
};

export const getDiscountPrice = (discount: number, currency: Currency) => {
    return discount ? (
        <>
            {c('Subscription saving').t`Save`}
            <Price className="ml-1" currency={currency}>
                {discount}
            </Price>
        </>
    ) : null;
};

const singleClassName = 'p-4 mb-4 border rounded bg-norm flex flex-nowrap items-stretch border-primary border-2';

export const SubscriptionItemView = ({
    title,
    loading,
    topRight,
    bottomLeft,
    bottomRight,
}: {
    title: ReactNode;
    topRight: ReactNode;
    bottomLeft: ReactNode;
    bottomRight: ReactNode;
    loading?: boolean;
}) => {
    return (
        <div className={singleClassName}>
            <div className="flex-1 pl-2">
                <div className="flex items-center">
                    <div className="flex-auto mr-4">
                        <strong className="text-lg">{title}</strong>
                    </div>
                    <strong className="text-lg shrink-0 color-primary">
                        {loading ? <EllipsisLoader /> : topRight}
                    </strong>
                </div>
                <div className="flex items-center">
                    <span className="color-weak flex flex-auto">{loading ? <EllipsisLoader /> : bottomLeft}</span>
                    <span className="color-success flex shrink-0">{loading ? null : bottomRight}</span>
                </div>
            </div>
        </div>
    );
};

const CycleItemView = ({
    loading,
    currency,
    text,
    total,
    monthlySuffix,
    totalPerMonth,
    discount,
    freeMonths,
    cycle,
}: {
    loading?: boolean;
    currency: Currency;
    text: string;
    total: number;
    monthlySuffix: string;
    totalPerMonth: number;
    discount: number;
    freeMonths: number;
    cycle: CYCLE;
}) => {
    return (
        <div className="flex-1 pl-2">
            <div className="flex items-center">
                <div className="flex-auto mr-4">
                    <strong className="text-lg">{text}</strong>
                    {freeMonths > 0 && (
                        <span className="color-success">
                            {` + `}
                            {getMonthFreeText(freeMonths)}
                        </span>
                    )}
                </div>
                <PlanPrice loading={loading} total={total} currency={currency} />
            </div>
            <div className="flex items-center">
                <span className="color-weak flex flex-auto" data-testid={`price-per-user-per-month-${cycle}`}>
                    {loading ? (
                        <EllipsisLoader />
                    ) : (
                        <Price currency={currency} suffix={monthlySuffix} data-testid="price-value-per-user-per-month">
                            {totalPerMonth}
                        </Price>
                    )}
                </span>
                <PlanDiscount loading={loading} discount={discount} currency={currency} />
            </div>
        </div>
    );
};

const CycleItem = ({
    totals,
    currency,
    cycle,
    monthlySuffix,
}: {
    totals: TotalPricings;
    monthlySuffix: string;
    cycle: CYCLE;
    currency: Currency;
}) => {
    const replacementCycle = cycle;
    const freeMonths = 0;
    const { total, perUserPerMonth, discount } = totals[replacementCycle];

    return (
        <CycleItemView
            text={getShortBillingText(replacementCycle)}
            currency={currency}
            discount={discount}
            monthlySuffix={monthlySuffix}
            freeMonths={freeMonths}
            total={total}
            totalPerMonth={perUserPerMonth}
            cycle={cycle}
        />
    );
};

export const getMonthlySuffix = (planIDs: PlanIDs) => {
    const supportedAddons = getSupportedAddons(planIDs);

    return (Object.keys(supportedAddons) as ADDON_NAMES[]).some((addon) => isMemberAddon(addon))
        ? c('Suffix').t`/user per month`
        : c('Suffix').t`/month`;
};

export const SubscriptionCheckoutCycleItem = ({
    checkResult,
    plansMap,
    planIDs,
    loading,
}: {
    checkResult: SubscriptionCheckResponse | undefined;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    loading?: boolean;
}) => {
    const cycle = checkResult?.Cycle || CYCLE.MONTHLY;
    const currency = checkResult?.Currency || DEFAULT_CURRENCY;
    const replacementCycle = cycle;
    const freeMonths = 0;

    const result = getCheckout({ planIDs, plansMap, checkResult });

    return (
        <div className={singleClassName}>
            <CycleItemView
                loading={loading}
                text={getShortBillingText(replacementCycle)}
                currency={currency}
                discount={result.discountPerCycle}
                monthlySuffix={c('Suffix').t`/month`}
                freeMonths={freeMonths}
                total={result.withDiscountPerCycle}
                totalPerMonth={result.withDiscountPerMonth}
                cycle={cycle}
            />
        </div>
    );
};

// todo: that's not a long-term solution, because we already have cycles like 3, 15, 18, 30
// which might appear for certain promotions.
function capMaximumCycle(
    maximumCycle: CYCLE,
    planIDs: PlanIDs,
    plansMap: PlansMap,
    subscription: Subscription | FreeSubscription | undefined
): CYCLE {
    const cappedPlans: {
        plan: PLANS | ADDON_NAMES;
        cycle: CYCLE;
    }[] = [
        { plan: ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_MAIL_BUSINESS, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_DRIVEPLUS, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_BUNDLE, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_PASS, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_VPN, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_VPN2024, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_VPN_PASS_BUNDLE, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_MAIL_PRO, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_BUNDLE_PRO_2024, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_MAIL_BUSINESS, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_PASS_PRO, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_VPN_BIZ, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_PASS_BIZ, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_VPN_PRO, cycle: CYCLE.YEARLY },
        { plan: ADDON_NAMES.MEMBER_SCRIBE_FAMILY, cycle: CYCLE.YEARLY },
    ];

    // filter a capped plan from the list of capped plans if it is present in planIDs
    const plan = cappedPlans.find((cappedPlan) => planIDs[cappedPlan.plan]);

    let result: CYCLE = maximumCycle;
    if (plan) {
        result = Math.min(maximumCycle, plan.cycle);
    }

    // if user already has a subscription or upcoming subscription with higher cycle, then we let user see it
    result = Math.max(result, subscription?.Cycle ?? 0, subscription?.UpcomingSubscription?.Cycle ?? 0);

    // however no matter what happens, we can't show a higher cycle than actually exist on the backend
    return notHigherThanAvailableOnBackend(planIDs, plansMap, result);
}

export const getAllowedCycles = ({
    subscription,
    minimumCycle,
    maximumCycle,
    planIDs,
    defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY],
    disableUpcomingCycleCheck,
    plansMap,
}: {
    subscription: Subscription | FreeSubscription | undefined;
    minimumCycle: CYCLE;
    maximumCycle: CYCLE;
    planIDs: PlanIDs;
    defaultCycles?: CYCLE[];
    disableUpcomingCycleCheck?: boolean;
    plansMap: PlansMap;
}): CYCLE[] => {
    const isTrialSubscription = isTrial(subscription);
    const sortedCycles = defaultCycles.sort((a, b) => b - a);
    const currentPlanName: PLANS | undefined = getPlan(subscription)?.Name;
    const newPlanName: PLANS | undefined = getPlanFromIds(planIDs);
    const isSamePlan = currentPlanName === newPlanName;

    const adjustedMaximumCycle = capMaximumCycle(maximumCycle, planIDs, plansMap, subscription);

    const result = sortedCycles.filter((cycle) => {
        const isHigherThanCurrentSubscription: boolean = cycle >= (subscription?.Cycle ?? 0);

        // disableUpcomingCycleCheck is an escape hatch to allow the selection of the cycle which is **lower** than upcoming one
        // but higher than current one
        // Example: user has current subscription 1 month and upcoming 12 months. Now they want to buy Scribe addon.
        // Normally, we would not show them the current one, because we consider that downgrading of the cycle.
        // But in this case, we want them to buy same 1 month subscription but with Scribe addon.
        const isHigherThanUpcoming: boolean =
            cycle >= (subscription?.UpcomingSubscription?.Cycle ?? 0) || !!disableUpcomingCycleCheck;

        const isEligibleForSelection: boolean =
            (isHigherThanCurrentSubscription && isHigherThanUpcoming) || isTrialSubscription || !isSamePlan;

        return cycle >= minimumCycle && cycle <= adjustedMaximumCycle && isEligibleForSelection;
    });

    return result;
};

export interface Props {
    cycle: CYCLE;
    minimumCycle?: CYCLE;
    maximumCycle?: CYCLE;
    mode: 'select' | 'buttons';
    currency: Currency;
    onChangeCycle: (cycle: CYCLE) => void;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    disabled?: boolean;
    faded?: boolean;
    subscription?: Subscription;
    defaultCycles?: CYCLE[];
    priceType?: PriceType;
    pricingMode?: PricingMode;
    disableUpcomingCycleCheck?: boolean;
}

const SubscriptionCycleSelector = ({
    cycle: selectedCycle,
    minimumCycle = CYCLE.MONTHLY,
    maximumCycle = CYCLE.TWO_YEARS,
    mode,
    onChangeCycle,
    currency,
    disabled,
    planIDs,
    plansMap,
    faded,
    subscription,
    defaultCycles,
    priceType,
    pricingMode,
    disableUpcomingCycleCheck,
}: Props) => {
    const cycles = getAllowedCycles({
        subscription,
        minimumCycle,
        maximumCycle,
        defaultCycles,
        planIDs,
        plansMap,
        disableUpcomingCycleCheck: !!disableUpcomingCycleCheck,
    });

    const monthlySuffix = getMonthlySuffix(planIDs);

    const totals = getTotals(planIDs, plansMap, priceType, pricingMode);

    const fadedClasses = clsx(faded && 'opacity-50 *:pointer-events-none');

    if (mode === 'select') {
        return (
            <div className={fadedClasses}>
                <InputField
                    label={c('Label').t`Billing cycle`}
                    as={SelectTwo}
                    bigger
                    value={selectedCycle}
                    onValue={(value: any) => onChangeCycle(value)}
                    assistiveText={
                        <Price currency={currency} suffix={monthlySuffix}>
                            {totals[selectedCycle].perUserPerMonth}
                        </Price>
                    }
                >
                    {cycles.map((cycle) => {
                        return (
                            <Option value={cycle} title={getShortBillingText(cycle)} key={cycle}>
                                <div className="flex justify-space-between">
                                    <span className="shrink-0">{getShortBillingText(cycle)}</span>
                                    <span className={clsx(['shrink-0', cycle !== selectedCycle && 'color-success'])}>
                                        {getDiscountPrice(totals[cycle].discount, currency)}
                                    </span>
                                </div>
                            </Option>
                        );
                    })}
                </InputField>
            </div>
        );
    }

    return (
        <ul className={clsx('unstyled m-0 plan-cycle-selector', fadedClasses)}>
            {cycles.map((cycle) => {
                const isSelected = cycle === selectedCycle;
                return (
                    <li key={`${cycle}`} className="flex items-stretch mb-4" data-testid={`cycle-${cycle}`}>
                        <button
                            className={clsx([
                                'w-full p-4 plan-cycle-button flex flex-nowrap border rounded text-left',
                                isSelected && 'border-primary',
                                isSelected && 'border-2',
                            ])}
                            disabled={disabled}
                            onClick={() => onChangeCycle(cycle)}
                            type="button"
                            aria-pressed={isSelected}
                        >
                            <div className="shrink-0" aria-hidden="true">
                                <Radio
                                    id={`${cycle}`}
                                    name="cycleFakeField"
                                    tabIndex={-1}
                                    checked={isSelected}
                                    readOnly
                                />
                            </div>
                            <CycleItem
                                totals={totals}
                                monthlySuffix={monthlySuffix}
                                currency={currency}
                                cycle={cycle}
                            />
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};

export default SubscriptionCycleSelector;
