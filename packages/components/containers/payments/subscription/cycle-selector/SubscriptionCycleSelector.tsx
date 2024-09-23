import { useMemo } from 'react';

import { c } from 'ttag';

import Radio from '@proton/components/components/input/Radio';
import Option from '@proton/components/components/option/Option';
import Price from '@proton/components/components/price/Price';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { SelectedPlan } from '@proton/payments';
import type { CYCLE } from '@proton/shared/lib/constants';
import { type ADDON_NAMES } from '@proton/shared/lib/constants';
import { getSupportedAddons, isMemberAddon } from '@proton/shared/lib/helpers/addons';
import { type PricingMode, type TotalPricings, getTotals } from '@proton/shared/lib/helpers/planIDs';
import type { Currency, PlanIDs, PlansMap, SubscriptionCheckResponse } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import InputField from '../../../../components/v2/field/InputField';
import { getShortBillingText } from '../../helper';
import { getDiscountPrice } from '../helpers';
import CycleItemView from './CycleItemView';

const CycleItem = ({
    totals,
    currency,
    cycle,
    monthlySuffix,
    loading,
}: {
    totals: TotalPricings;
    monthlySuffix: string;
    cycle: CYCLE;
    currency: Currency;
    loading: boolean;
}) => {
    const freeMonths = 0;
    const { discountedTotal, viewPricePerMonth, discount } = totals[cycle];

    return (
        <CycleItemView
            text={getShortBillingText(cycle)}
            currency={currency}
            discount={discount}
            monthlySuffix={monthlySuffix}
            freeMonths={freeMonths}
            total={discountedTotal}
            totalPerMonth={viewPricePerMonth}
            cycle={cycle}
            loading={loading}
        />
    );
};

const getMonthlySuffix = (planIDs: PlanIDs) => {
    const supportedAddons = getSupportedAddons(planIDs);

    return (Object.keys(supportedAddons) as ADDON_NAMES[]).some((addon) => isMemberAddon(addon))
        ? c('Suffix').t`/user per month`
        : c('Suffix').t`/month`;
};

export interface Props {
    cycle: CYCLE;
    mode: 'select' | 'buttons';
    currency: Currency;
    onChangeCycle: (cycle: CYCLE) => void;
    plansMap: PlansMap;
    planIDs: PlanIDs;
    disabled?: boolean;
    loading?: boolean;
    faded?: boolean;
    pricingMode?: PricingMode;
    additionalCheckResults: SubscriptionCheckResponse[] | undefined;
    allowedCycles: CYCLE[];
}

const SubscriptionCycleSelector = ({
    cycle: selectedCycle,
    mode,
    onChangeCycle,
    currency,
    disabled,
    loading,
    planIDs,
    plansMap,
    faded,
    pricingMode,
    additionalCheckResults = [],
    allowedCycles,
}: Props) => {
    const monthlySuffix = getMonthlySuffix(planIDs);

    const selectedPlan = useMemo(() => {
        return new SelectedPlan(planIDs, plansMap, selectedCycle, currency);
    }, [planIDs, plansMap, selectedCycle, currency]);

    const totals = getTotals(planIDs, plansMap, additionalCheckResults, pricingMode, selectedPlan);

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
                    {allowedCycles.map((cycle) => {
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
            {allowedCycles.map((cycle) => {
                const isSelected = cycle === selectedCycle;
                const billingText = getShortBillingText(cycle);
                // translator: "Select billing cycle 1 month" or "Select billing cycle 2 months"
                const ariaLabel = c('Action').t`Select billing cycle ${billingText}`;

                return (
                    <li key={`${cycle}`} className="flex items-stretch mb-4" data-testid={`cycle-${cycle}`}>
                        <button
                            className={clsx([
                                'w-full p-4 plan-cycle-button flex flex-nowrap border rounded text-left',
                                isSelected && 'border-primary',
                                isSelected && 'border-2',
                            ])}
                            disabled={disabled || loading}
                            onClick={() => onChangeCycle(cycle)}
                            type="button"
                            aria-pressed={isSelected}
                            aria-label={ariaLabel}
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
                                loading={!!loading}
                            />
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};

export default SubscriptionCycleSelector;
