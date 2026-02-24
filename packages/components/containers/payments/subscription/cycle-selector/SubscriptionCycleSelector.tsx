import { c } from 'ttag';

import Radio from '@proton/components/components/input/Radio';
import Option from '@proton/components/components/option/Option';
import Price from '@proton/components/components/price/Price';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { InputField } from '@proton/components/components/v2/field/InputField';
import type { CYCLE, Currency, PlanIDs, PlansMap } from '@proton/payments';
import { type PaymentsCheckoutUI, getCheckoutUi, getOptimisticCheckResult } from '@proton/payments/core/checkout';
import type { SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { useCouponConfig } from '../coupon-config/useCouponConfig';
import { getDiscountPrice, getShortBillingText } from '../helpers';
import CycleItemView from './CycleItemView';

const CycleItem = ({
    checkout,
    loading,
    plansMap,
}: {
    checkout: PaymentsCheckoutUI;
    loading: boolean;
    plansMap: PlansMap;
}) => {
    const couponConfig = useCouponConfig({
        checkResult: checkout.checkResult,
        planIDs: checkout.planIDs,
        plansMap,
    });

    return <CycleItemView loading={loading} checkout={checkout} couponConfig={couponConfig} />;
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
    additionalCheckResults: SubscriptionEstimation[] | undefined;
    allowedCycles: CYCLE[];
    checkResult: SubscriptionEstimation | undefined;
    listItemClassName?: string;
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
    additionalCheckResults = [],
    allowedCycles,
    checkResult: checkResultProp,
    listItemClassName,
}: Props) => {
    const calculateCheckout = (cycle: CYCLE): PaymentsCheckoutUI => {
        const checkResult =
            [...additionalCheckResults, checkResultProp].filter(isTruthy).find((it) => it.Cycle === cycle) ??
            getOptimisticCheckResult({
                planIDs,
                plansMap,
                currency,
                cycle,
            });

        return getCheckoutUi({
            planIDs,
            plansMap,
            checkResult,
        });
    };

    const fadedClasses = clsx(faded && 'opacity-50 *:pointer-events-none');
    const listItemClasses = listItemClassName ?? 'flex items-stretch mb-4';

    if (mode === 'select') {
        const selectedCycleCheckout = calculateCheckout(selectedCycle);

        return (
            <div className={fadedClasses}>
                <InputField
                    label={c('Label').t`Billing cycle`}
                    as={SelectTwo}
                    bigger
                    value={selectedCycle}
                    onValue={(value: any) => onChangeCycle(value)}
                    assistiveText={
                        <Price currency={currency} suffix={selectedCycleCheckout.monthlySuffix}>
                            {selectedCycleCheckout.viewPricePerMonth}
                        </Price>
                    }
                >
                    {allowedCycles.map((cycle) => {
                        const { discountPerCycle } = calculateCheckout(cycle);

                        return (
                            <Option value={cycle} title={getShortBillingText(cycle, planIDs)} key={cycle}>
                                <div className="flex justify-space-between">
                                    <span className="shrink-0">{getShortBillingText(cycle, planIDs)}</span>
                                    <span className={clsx(['shrink-0', cycle !== selectedCycle && 'color-success'])}>
                                        {getDiscountPrice(discountPerCycle, currency)}
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
                const billingText = getShortBillingText(cycle, planIDs);
                // translator: "Select billing cycle 1 month" or "Select billing cycle 2 months"
                const ariaLabel = c('Action').t`Select billing cycle ${billingText}`;

                return (
                    <li key={`${cycle}`} className={listItemClasses} data-testid={`cycle-${cycle}`}>
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
                            <CycleItem checkout={calculateCheckout(cycle)} loading={!!loading} plansMap={plansMap} />
                        </button>
                    </li>
                );
            })}
        </ul>
    );
};

export default SubscriptionCycleSelector;
