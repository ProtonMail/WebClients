import { ReactNode } from 'react';

import { c } from 'ttag';

import { CYCLE, DEFAULT_CURRENCY, MEMBER_ADDON_PREFIX, PLANS } from '@proton/shared/lib/constants';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import { getSupportedAddons } from '@proton/shared/lib/helpers/planIDs';
import {
    TotalPricing,
    allCycles,
    getPlan,
    getPlanFromIds,
    getPricingFromPlanIDs,
    getTotalFromPricing,
    isTrial,
} from '@proton/shared/lib/helpers/subscription';
import {
    Currency,
    PlanIDs,
    PlansMap,
    PriceType,
    SubscriptionCheckResponse,
    SubscriptionModel,
} from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { EllipsisLoader, Option, Price, Radio, SelectTwo } from '../../../components';
import InputField from '../../../components/v2/field/InputField';
import { getMonthFreeText } from '../../offers/helpers/offerCopies';
import { getShortBillingText } from '../helper';

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
                <strong className="text-lg shrink-0 color-primary">
                    {loading ? (
                        <EllipsisLoader />
                    ) : (
                        <>
                            {c('Subscription price').t`For`}
                            <Price className="ml-1" currency={currency} data-testid="subscription-total-price">
                                {total}
                            </Price>
                        </>
                    )}
                </strong>
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
                <span className="color-success flex shrink-0">
                    {loading ? null : getDiscountPrice(discount, currency)}
                </span>
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
    return Object.keys(supportedAddons).some((addon) => addon.startsWith(MEMBER_ADDON_PREFIX))
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
                monthlySuffix={getMonthlySuffix(planIDs)}
                freeMonths={freeMonths}
                total={result.withDiscountPerCycle}
                totalPerMonth={result.withDiscountPerMonth}
                cycle={cycle}
            />
        </div>
    );
};

export const getAllowedCycles = ({
    subscription,
    minimumCycle,
    planIDs,
    defaultCycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY],
}: {
    subscription: SubscriptionModel | undefined;
    minimumCycle: CYCLE;
    planIDs: PlanIDs;
    defaultCycles?: CYCLE[];
}): CYCLE[] => {
    const isTrialSubscription = isTrial(subscription);

    const [largestCycle, ...restCycles] = defaultCycles.sort((a, b) => b - a);

    const currentPlanName: PLANS | undefined = getPlan(subscription)?.Name;
    const newPlanName: PLANS | undefined = getPlanFromIds(planIDs);
    const isSamePlan = currentPlanName === newPlanName;

    const filteredCycles = restCycles.filter((cycle) => {
        const isHigherThanCurrentSubscription = cycle >= (subscription?.Cycle ?? 0);
        const isHigherThanUpcoming = cycle >= (subscription?.UpcomingSubscription?.Cycle ?? 0);

        const isEligibleForSelection =
            (isHigherThanCurrentSubscription && isHigherThanUpcoming) || isTrialSubscription || !isSamePlan;

        return cycle >= minimumCycle && isEligibleForSelection;
    });

    return [largestCycle, ...filteredCycles];
};

export interface Props {
    cycle: CYCLE;
    minimumCycle?: CYCLE;
    mode: 'select' | 'buttons';
    currency: Currency;
    onChangeCycle: (cycle: CYCLE) => void;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    disabled?: boolean;
    faded?: boolean;
    subscription?: SubscriptionModel;
    defaultCycles?: CYCLE[];
    priceType?: PriceType;
}

const SubscriptionCycleSelector = ({
    cycle: selectedCycle,
    minimumCycle = CYCLE.MONTHLY,
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
}: Props) => {
    const cycles = getAllowedCycles({ subscription, minimumCycle, defaultCycles, planIDs });

    const monthlySuffix = getMonthlySuffix(planIDs);

    const pricing = getPricingFromPlanIDs(planIDs, plansMap, priceType);

    const totals = allCycles.reduce<{ [key in CYCLE]: TotalPricing }>((acc, cycle) => {
        acc[cycle] = getTotalFromPricing(pricing, cycle);
        return acc;
    }, {} as any);

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
