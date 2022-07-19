import React from 'react';
import { c, msgid } from 'ttag';
import { CYCLE, PLAN_TYPES } from '@proton/shared/lib/constants';
import { Plan, PlanIDs, Currency, PlansMap } from '@proton/shared/lib/interfaces';
import { toMap } from '@proton/shared/lib/helpers/object';
import { getSupportedAddons } from '@proton/shared/lib/helpers/planIDs';

import { Option, Price, Radio, SelectTwo } from '../../../components';

import { classnames } from '../../../helpers';
import InputField from '../../../components/v2/field/InputField';

interface Props {
    cycle: CYCLE;
    mode: 'select' | 'buttons';
    currency: Currency;
    onChangeCycle: (cycle: CYCLE) => void;
    plans: Plan[];
    planIDs: PlanIDs;
    disabled?: boolean;
}

const getText = (n: number) => {
    return c('Label').ngettext(msgid`${n} month`, `${n} months`, n);
};

const SubscriptionCycleSelector = ({
    cycle: cycleSelected,
    mode,
    onChangeCycle,
    currency,
    disabled,
    planIDs,
    plans,
}: Props) => {
    const cycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];

    const supportedAddons = getSupportedAddons(planIDs);
    const plansMap = toMap(plans, 'Name') as PlansMap;
    const pricing = Object.entries(planIDs).reduce(
        (acc, [planName, quantity]) => {
            const plan = plansMap[planName as keyof PlansMap];
            if (!plan) {
                return acc;
            }

            acc.all[CYCLE.MONTHLY] += quantity * plan.Pricing[CYCLE.MONTHLY];
            acc.all[CYCLE.YEARLY] += quantity * plan.Pricing[CYCLE.YEARLY];
            acc.all[CYCLE.TWO_YEARS] += quantity * plan.Pricing[CYCLE.TWO_YEARS];

            if (plan.Type === PLAN_TYPES.PLAN) {
                acc.plans[CYCLE.MONTHLY] += quantity * plan.Pricing[CYCLE.MONTHLY];
                acc.plans[CYCLE.YEARLY] += quantity * plan.Pricing[CYCLE.YEARLY];
                acc.plans[CYCLE.TWO_YEARS] += quantity * plan.Pricing[CYCLE.TWO_YEARS];
            }

            return acc;
        },
        {
            all: { [CYCLE.MONTHLY]: 0, [CYCLE.YEARLY]: 0, [CYCLE.TWO_YEARS]: 0 },
            plans: {
                [CYCLE.MONTHLY]: 0,
                [CYCLE.YEARLY]: 0,
                [CYCLE.TWO_YEARS]: 0,
            },
        }
    );

    const getDiscountPrice = (discount: number) => {
        return discount ? (
            <>
                {c('Subscription saving').t`Save`}
                <Price className="ml0-25" currency={currency}>
                    {discount}
                </Price>
            </>
        ) : null;
    };

    const getTotal = (cycle: CYCLE) => {
        const total = pricing.all[cycle];
        const totalPerMonth = pricing.plans[cycle] / cycle;
        const discount = cycle === CYCLE.MONTHLY ? 0 : pricing.all[CYCLE.MONTHLY] * cycle - total;
        return {
            discount,
            total,
            totalPerMonth,
        };
    };

    const monthlySuffix = Object.keys(supportedAddons).some((addon) => addon.startsWith('1member'))
        ? c('Suffix').t`/user per month`
        : c('Suffix').t`/month`;

    const totals = cycles.reduce<{ [key in CYCLE]: { discount: number; total: number; totalPerMonth: number } }>(
        (acc, cycle) => {
            acc[cycle] = getTotal(cycle);
            return acc;
        },
        {} as any
    );

    if (mode === 'select') {
        return (
            <InputField
                label={c('Label').t`Billing cycle`}
                as={SelectTwo}
                bigger
                value={cycleSelected}
                onValue={(value: any) => onChangeCycle(value)}
                assistiveText={
                    <Price currency={currency} suffix={monthlySuffix}>
                        {totals[cycleSelected].totalPerMonth}
                    </Price>
                }
            >
                {cycles.map((cycle) => {
                    return (
                        <Option value={cycle} title={getText(cycle)} key={cycle}>
                            <div className="flex flex-justify-space-between">
                                <span className="flex-item-noshrink">{getText(cycle)}</span>
                                <span
                                    className={classnames([
                                        'flex-item-noshrink',
                                        cycle !== cycleSelected && 'color-success',
                                    ])}
                                >
                                    {getDiscountPrice(totals[cycle].discount)}
                                </span>
                            </div>
                        </Option>
                    );
                })}
            </InputField>
        );
    }

    return (
        <ul className="unstyled m0 plan-cycle-selector">
            {cycles.map((cycle) => {
                const isSelected = cycle === cycleSelected;
                const { total, totalPerMonth, discount } = totals[cycle];
                return (
                    <li key={`${cycle}`} className="rounded bg-norm flex flex-align-items-stretch">
                        <button
                            className={classnames([
                                'w100 p1 plan-cycle-button flex flex-nowrap border rounded text-left mb1',
                                isSelected && 'border-primary',
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
                            <div className="flex-item-fluid pl0-5">
                                <div className="flex flex-align-items-center">
                                    <strong className="text-lg flex-item-fluid mr1">{getText(cycle)}</strong>
                                    <strong className="text-lg flex-item-noshrink color-primary">
                                        {c('Subscription price').t`For`}
                                        <Price className="ml0-25" currency={currency}>
                                            {total}
                                        </Price>
                                    </strong>
                                </div>
                                <div className="flex flex-align-items-center">
                                    <span className="color-weak flex flex-item-fluid">
                                        <Price currency={currency} suffix={monthlySuffix}>
                                            {totalPerMonth}
                                        </Price>
                                    </span>
                                    <span className="color-success flex flex-item-noshrink">
                                        {getDiscountPrice(discount)}
                                    </span>
                                </div>
                            </div>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};

export default SubscriptionCycleSelector;
