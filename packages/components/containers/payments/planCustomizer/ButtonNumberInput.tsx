import { useState } from 'react';

import { c } from 'ttag';

import clamp from '@proton/utils/clamp';
import clsx from '@proton/utils/clsx';

import { Icon } from '../../../components';

export const getIsValidValue = (min: number, max: number, step: number, newValue?: number) => {
    return newValue !== undefined && newValue >= min && newValue <= max && newValue % step === 0;
};

export const ButtonNumberInput = ({
    value,
    onChange,
    id,
    min = 0,
    max = 999,
    step = 1,
    disabled = false,
}: {
    step?: number;
    id: string;
    min?: number;
    max?: number;
    value: number;
    disabled?: boolean;
    onChange?: (newValue: number) => void;
}) => {
    const [tmpValue, setTmpValue] = useState<number | null | undefined>(undefined);

    const handleOnChange = (value: number) => {
        const safeValue = clamp(value, min, max);
        if (getIsValidValue(min, max, step, safeValue)) {
            onChange?.(safeValue);
        }
    };

    const currentValue = Number(tmpValue ?? value);

    const handleAddition = (diff: number) => {
        handleOnChange(currentValue + step * diff);
    };

    const isDecDisabled = disabled || !getIsValidValue(min, max, step, currentValue - step);
    const isIncDisabled = disabled || !getIsValidValue(min, max, step, currentValue + step);

    return (
        <div className="border rounded shrink-0 flex flex-nowrap">
            <button
                type="button"
                title={c('Action').t`Decrease`}
                className={clsx(['p-2 flex', isDecDisabled && 'color-disabled'])}
                disabled={isDecDisabled}
                onClick={() => {
                    handleAddition(-1);
                }}
            >
                <Icon name="minus" alt={c('Action').t`Decrease`} className="m-auto" />
            </button>
            <label htmlFor={id} className="my-2 flex">
                <input
                    autoComplete="off"
                    min={min}
                    max={max}
                    value={tmpValue === null ? '' : currentValue}
                    id={id}
                    className="w-custom border-left border-right text-center"
                    style={{ '--w-custom': '6em' }}
                    onBlur={() => {
                        // Revert to the latest valid value upon blur
                        setTmpValue(undefined);
                    }}
                    onChange={({ target: { value: newValue } }) => {
                        if (newValue === '') {
                            setTmpValue(null);
                            return;
                        }
                        setTmpValue(undefined);
                        const newIntValue = parseInt(newValue, 10);
                        handleOnChange(newIntValue);
                    }}
                />
            </label>
            <button
                type="button"
                title={c('Action').t`Increase`}
                className={clsx(['p-2 flex', isIncDisabled && 'color-disabled'])}
                disabled={isIncDisabled}
                onClick={() => {
                    handleAddition(1);
                }}
            >
                <Icon name="plus" alt={c('Action').t`Increase`} className="m-auto" />
            </button>
        </div>
    );
};
