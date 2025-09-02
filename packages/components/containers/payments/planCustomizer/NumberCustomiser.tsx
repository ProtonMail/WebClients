import Info from '@proton/components/components/link/Info';
import type { Plan } from '@proton/payments';

import { ButtonNumberInput } from './ButtonNumberInput';
import type { DecreaseBlockedReason, IncreaseBlockedReason } from './helpers';

export interface NumberCustomiserProps {
    addon: Plan;

    label: string;
    tooltip?: string;

    value: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    onChange?: (newValue: number) => void;
    decreaseBlockedReasons: DecreaseBlockedReason[];
    increaseBlockedReasons: IncreaseBlockedReason[];
    increaseBlockedReasonText?: string;
}

export const NumberCustomiser = ({
    addon,
    label,
    tooltip,
    value,
    min,
    max,
    step,
    disabled,
    onChange,
    decreaseBlockedReasons,
    increaseBlockedReasons,
    increaseBlockedReasonText,
}: NumberCustomiserProps) => {
    const inputId = addon.Name;

    if (max !== undefined && min !== undefined && max <= min) {
        // If nothing can be done with this (max <= min), don't show it
        return null;
    }

    return (
        <div className="flex *:min-size-auto md:flex-nowrap items-center">
            <label htmlFor={inputId} className="w-full md:w-auto flex-1 plan-customiser-addon-label text-bold pr-2">
                {label}
                {tooltip && <Info buttonClass="ml-2" title={tooltip} />}
            </label>
            <ButtonNumberInput
                key={`${addon.Name}-input`}
                id={inputId}
                data-testid={`${addon.Name}-customizer`}
                value={value}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                onChange={onChange}
                decreaseBlockedReasons={decreaseBlockedReasons}
                increaseBlockedReasons={increaseBlockedReasons}
                increaseBlockedReasonText={increaseBlockedReasonText}
            />
        </div>
    );
};
