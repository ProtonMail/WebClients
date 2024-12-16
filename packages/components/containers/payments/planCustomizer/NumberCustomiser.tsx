import Info from '@proton/components/components/link/Info';
import type { Plan } from '@proton/shared/lib/interfaces';

import { ButtonNumberInput } from './ButtonNumberInput';
import { type DecreaseBlockedReason } from './helpers';

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
}: NumberCustomiserProps) => {
    const inputId = addon.Name;
    return (
        <div className="flex *:min-size-auto md:flex-nowrap items-center">
            <label htmlFor={inputId} className="w-full md:w-auto flex-1 plan-customiser-addon-label text-bold pr-2">
                {label}
                {tooltip && <Info buttonClass="ml-2" title={tooltip} />}
            </label>
            <ButtonNumberInput
                key={`${addon.Name}-input`}
                id={inputId}
                value={value}
                min={min}
                max={max}
                step={step}
                disabled={disabled}
                onChange={onChange}
                decreaseBlockedReasons={decreaseBlockedReasons}
            />
        </div>
    );
};
