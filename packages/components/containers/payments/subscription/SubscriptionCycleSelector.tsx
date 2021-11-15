import React from 'react';
import { c } from 'ttag';
import { CYCLE } from '@proton/shared/lib/constants';
import { Plan, PlanIDs, Currency, PlansMap } from '@proton/shared/lib/interfaces';
import { toMap } from '@proton/shared/lib/helpers/object';

import { Price, Badge } from '../../../components';

import { classnames } from '../../../helpers';

import './SubscriptionCycleSelector.scss';

interface Props {
    cycle: CYCLE;
    currency: Currency;
    onChangeCycle: (cycle: CYCLE) => void;
    plans: Plan[];
    planIDs: PlanIDs;
    disabled?: boolean;
}

const getTitle = (cycle: CYCLE) => {
    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('Title').t`1 month`;
        case CYCLE.YEARLY:
            return c('Title').t`1 year`;
        case CYCLE.TWO_YEARS:
            return c('Title').t`2 years`;
        default:
            return '';
    }
};

const getDescription = (cycle: CYCLE, amount: number, currency: Currency) => {
    const amountNode = (
        <Price key="amount" currency={currency}>
            {amount}
        </Price>
    );
    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('Title').jt`Renews every month at ${amountNode}`;
        case CYCLE.YEARLY:
            return c('Title').jt`Renews every year at ${amountNode}`;
        case CYCLE.TWO_YEARS:
            return c('Title').jt`Renews every 2 years at ${amountNode}`;
        default:
            return '';
    }
};

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
                const title = getTitle(cycle);
                const total = pricing[cycle];
                const totalPerMonth = total / cycle;
                const description = getDescription(cycle, total, currency);
                const discount = cycle === CYCLE.MONTHLY ? 0 : (totalPerMonth * 100) / pricing[CYCLE.MONTHLY] - 100;
                return (
                    <li key={`${cycle}`} className="rounded bg-norm flex flex-align-items-stretch">
                        <button
                            className={classnames([
                                'w100 text-center pt0-5 pb1 pl0-5 pr0-5 plan-cycle-button flex flex-nowrap flex-column border rounded',
                                isSelected && 'plan-cycle-button-selected bg-weak',
                            ])}
                            disabled={disabled}
                            onClick={() => onChangeCycle(cycle)}
                            type="button"
                        >
                            <div className="border-bottom mb0-5 ml0-5 mr0-5 text-center">
                                <Price
                                    className="mb0-5 mt0-5 text-xl text-semibold plan-cycle-price"
                                    currency={currency}
                                    suffix={c('Suffix').t`per month`}
                                >
                                    {totalPerMonth}
                                </Price>
                            </div>
                            <div className="flex-item-fluid-auto flex flex-items-align-center flex-column flex-nowrap">
                                <div className="inline-flex center on-tiny-mobile-flex-column-no-stretch flex-align-items-center plan-cycle-duration">
                                    <span className="m0">{title}</span>
                                    {discount ? (
                                        <Badge
                                            className="ml1 on-tablet-ml0-5 on-tiny-mobile-ml0 align-middle"
                                            type="success"
                                        >
                                            {Math.round(discount)}%
                                        </Badge>
                                    ) : null}
                                </div>

                                <div className="plan-cycle-description text-sm m0 color-weak">{description}</div>
                            </div>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};

export default SubscriptionCycleSelector;
