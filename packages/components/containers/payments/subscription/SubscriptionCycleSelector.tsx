import React from 'react';
import { c, msgid } from 'ttag';
import { CYCLE } from '@proton/shared/lib/constants';
import { Plan, PlanIDs, Currency, PlansMap } from '@proton/shared/lib/interfaces';
import { toMap } from '@proton/shared/lib/helpers/object';

import { Price, Radio } from '../../../components';

import { classnames } from '../../../helpers';

interface Props {
    cycle: CYCLE;
    currency: Currency;
    onChangeCycle: (cycle: CYCLE) => void;
    plans: Plan[];
    planIDs: PlanIDs;
    disabled?: boolean;
}

const SubscriptionCycleSelector = ({
    cycle: cycleSelected,
    onChangeCycle,
    currency,
    disabled,
    planIDs,
    plans,
}: Props) => {
    const cycles = [CYCLE.TWO_YEARS, CYCLE.YEARLY, CYCLE.MONTHLY];
    const plansMap = toMap(plans, 'Name') as PlansMap;
    const pricing = Object.entries(planIDs).reduce(
        (acc, [planName, quantity]) => {
            const plan = plansMap[planName as keyof PlansMap];
            if (!plan) {
                return acc;
            }
            acc[CYCLE.MONTHLY] += quantity * plan.Pricing[CYCLE.MONTHLY];
            acc[CYCLE.YEARLY] += quantity * plan.Pricing[CYCLE.YEARLY];
            acc[CYCLE.TWO_YEARS] += quantity * plan.Pricing[CYCLE.TWO_YEARS];
            return acc;
        },
        { [CYCLE.MONTHLY]: 0, [CYCLE.YEARLY]: 0, [CYCLE.TWO_YEARS]: 0 }
    );

    return (
        <ul className="unstyled m0 plan-cycle-selector">
            {cycles.map((cycle) => {
                const isSelected = cycle === cycleSelected;
                const total = pricing[cycle];
                const totalPerMonth = total / cycle;
                const discount = cycle === CYCLE.MONTHLY ? 0 : pricing[CYCLE.MONTHLY] * cycle - total;
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
                                <Radio id={`${cycle}`} name="cycleFakeField" tabIndex={-1} checked={isSelected} />
                            </div>
                            <div className="flex-item-fluid pl0-5">
                                <div className="flex flex-align-items-center">
                                    <strong className="text-lg flex-item-fluid mr1">
                                        {c('Subscription cycle').ngettext(
                                            msgid`${cycle} month`,
                                            `${cycle} months`,
                                            cycle
                                        )}
                                    </strong>
                                    <span className="color-weak flex flex-item-noshrink">
                                        <Price
                                            className="text-semibold"
                                            currency={currency}
                                            suffix={c('Suffix').t`/month`}
                                        >
                                            {totalPerMonth}
                                        </Price>
                                    </span>
                                </div>
                                <div className="flex flex-align-items-center">
                                    <strong className="text-lg flex-item-fluid mr1 color-primary">
                                        {c('Subscription price').t`For`}
                                        <Price className="ml0-25" currency={currency}>
                                            {total}
                                        </Price>
                                    </strong>
                                    <span className="color-success flex flex-item-noshrink text-semibold">
                                        {discount ? (
                                            <>
                                                {c('Subscription saving').t`Save`}
                                                <Price className="ml0-25" currency={currency}>
                                                    {discount}
                                                </Price>
                                            </>
                                        ) : null}
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
