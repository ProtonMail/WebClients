import { c } from 'ttag';

import { CYCLE, DEFAULT_CURRENCY, MEMBER_ADDON_PREFIX } from '@proton/shared/lib/constants';
import { getCheckout } from '@proton/shared/lib/helpers/checkout';
import { getSupportedAddons } from '@proton/shared/lib/helpers/planIDs';
import {
    TotalPricing,
    allCycles,
    getNormalCycleFromCustomCycle,
    getPricingFromPlanIDs,
    getTotalFromPricing,
} from '@proton/shared/lib/helpers/subscription';
import { Currency, PlanIDs, PlansMap, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { Option, Price, Radio, SelectTwo } from '../../../components';
import InputField from '../../../components/v2/field/InputField';
import { getMonthFreeText, getMonthsFree } from '../../offers/helpers/offerCopies';
import RenewalNotice from '../RenewalNotice';
import { getShortBillingText } from '../helper';

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
}

type TotalPricings = {
    [key in CYCLE]: TotalPricing;
};

const getDiscountPrice = (discount: number, currency: Currency) => {
    return discount ? (
        <>
            {c('Subscription saving').t`Save`}
            <Price className="ml-1" currency={currency}>
                {discount}
            </Price>
        </>
    ) : null;
};

const CycleItemView = ({
    currency,
    text,
    total,
    monthlySuffix,
    totalPerMonth,
    discount,
    freeMonths,
    cycle,
}: {
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
        <>
            <div className="flex-item-fluid pl-2">
                <div className="flex flex-align-items-center">
                    <div className="flex-item-fluid-auto mr-4">
                        <strong className="text-lg">{text}</strong>
                        {freeMonths > 0 && (
                            <span className="color-success">
                                {` + `}
                                {getMonthFreeText(freeMonths)}
                            </span>
                        )}
                    </div>
                    <strong className="text-lg flex-item-noshrink color-primary">
                        {c('Subscription price').t`For`}
                        <Price className="ml-1" currency={currency} data-testid="subscription-total-price">
                            {total}
                        </Price>
                    </strong>
                </div>
                <div className="flex flex-align-items-center">
                    <span
                        className="color-weak flex flex-item-fluid-auto"
                        data-testid={`price-per-user-per-month-${cycle}`}
                    >
                        <Price currency={currency} suffix={monthlySuffix}>
                            {totalPerMonth}
                        </Price>
                    </span>
                    <span className="color-success flex flex-item-noshrink">
                        {getDiscountPrice(discount, currency)}
                    </span>
                </div>
            </div>
        </>
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
    const replacementCycle = getNormalCycleFromCustomCycle(cycle) || cycle;
    const freeMonths = getMonthsFree(cycle);
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

const singleClassName =
    'p-4 mb-4 border rounded bg-norm flex flex-nowrap flex-align-items-stretch border-primary border-2';

const getMonthlySuffix = (planIDs: PlanIDs) => {
    const supportedAddons = getSupportedAddons(planIDs);
    return Object.keys(supportedAddons).some((addon) => addon.startsWith(MEMBER_ADDON_PREFIX))
        ? c('Suffix').t`/user per month`
        : c('Suffix').t`/month`;
};

export const SubscriptionCheckoutCycleItem = ({
    checkResult,
    plansMap,
    planIDs,
}: {
    checkResult: SubscriptionCheckResponse | undefined;
    plansMap: PlansMap;
    planIDs: PlanIDs;
}) => {
    const cycle = checkResult?.Cycle || CYCLE.MONTHLY;
    const currency = checkResult?.Currency || DEFAULT_CURRENCY;
    const replacementCycle = getNormalCycleFromCustomCycle(cycle) || cycle;
    const freeMonths = getMonthsFree(cycle);

    const result = getCheckout({ planIDs, plansMap, checkResult });

    return (
        <div className={singleClassName}>
            <CycleItemView
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

const SubscriptionCycleSelector = ({
    cycle: cycleSelected,
    minimumCycle = CYCLE.MONTHLY,
    mode,
    onChangeCycle,
    currency,
    disabled,
    planIDs,
    plansMap,
    faded,
}: Props) => {
    const filteredCycles = [CYCLE.YEARLY, CYCLE.MONTHLY].filter((cycle) => cycle >= minimumCycle);

    const cycles = [CYCLE.TWO_YEARS, ...filteredCycles];

    const monthlySuffix = getMonthlySuffix(planIDs);

    const pricing = getPricingFromPlanIDs(planIDs, plansMap);

    const totals = allCycles.reduce<{ [key in CYCLE]: TotalPricing }>((acc, cycle) => {
        acc[cycle] = getTotalFromPricing(pricing, cycle);
        return acc;
    }, {} as any);

    const fadedClasses = clsx(faded && 'opacity-50 no-pointer-events-children');

    if (cycles.length === 1) {
        const cycle = cycles[0];

        return (
            <>
                <div className={clsx(singleClassName, 'mb-2', fadedClasses)}>
                    <CycleItem monthlySuffix={monthlySuffix} totals={totals} cycle={cycle} currency={currency} />
                </div>
                <RenewalNotice renewCycle={cycleSelected} />
            </>
        );
    }

    if (mode === 'select') {
        return (
            <div className={fadedClasses}>
                <InputField
                    label={c('Label').t`Billing cycle`}
                    as={SelectTwo}
                    bigger
                    value={cycleSelected}
                    onValue={(value: any) => onChangeCycle(value)}
                    assistiveText={
                        <Price currency={currency} suffix={monthlySuffix}>
                            {totals[cycleSelected].perUserPerMonth}
                        </Price>
                    }
                >
                    {cycles.map((cycle) => {
                        return (
                            <Option value={cycle} title={getShortBillingText(cycle)} key={cycle}>
                                <div className="flex flex-justify-space-between">
                                    <span className="flex-item-noshrink">{getShortBillingText(cycle)}</span>
                                    <span
                                        className={clsx([
                                            'flex-item-noshrink',
                                            cycle !== cycleSelected && 'color-success',
                                        ])}
                                    >
                                        {getDiscountPrice(totals[cycle].discount, currency)}
                                    </span>
                                </div>
                            </Option>
                        );
                    })}
                </InputField>
                <RenewalNotice renewCycle={cycleSelected} className="mt-2" />
            </div>
        );
    }

    return (
        <>
            <ul className={clsx('unstyled m-0 plan-cycle-selector', fadedClasses)}>
                {cycles.map((cycle) => {
                    const isSelected = cycle === cycleSelected;
                    return (
                        <li
                            key={`${cycle}`}
                            className="flex flex-align-items-stretch mb-4"
                            data-testid={`cycle-${cycle}`}
                        >
                            <button
                                className={clsx([
                                    'w100 p-4 plan-cycle-button flex flex-nowrap border rounded text-left',
                                    isSelected && 'border-primary',
                                    isSelected && 'border-2',
                                ])}
                                disabled={disabled}
                                onClick={() => onChangeCycle(cycle)}
                                type="button"
                                aria-pressed={isSelected}
                            >
                                <div className="flex-item-noshrink" aria-hidden="true">
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
            <RenewalNotice renewCycle={cycleSelected} />
        </>
    );
};

export default SubscriptionCycleSelector;
