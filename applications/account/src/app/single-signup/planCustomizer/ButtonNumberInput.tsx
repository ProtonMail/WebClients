import type { ComponentPropsWithoutRef } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props extends ComponentPropsWithoutRef<'div'> {
    id: string;
    min: number;
    max: number;
    step: number;
    value: number;
    onValue: (newValue: number) => void;
    disabled?: boolean;
}

const ButtonNumberInput = ({ id, min, max, step, value, onValue, disabled = false, className, ...rest }: Props) => {
    const [tmpValue, setTmpValue] = useState<number | undefined>(value);

    const getIsValidValue = (newValue?: number) => {
        return newValue !== undefined && newValue >= min && newValue <= max && newValue % step === 0;
    };

    const isDecDisabled = disabled || !getIsValidValue((tmpValue || 0) - step);
    const isIncDisabled = disabled || !getIsValidValue((tmpValue || 0) + step);

    const isValidTmpValue = getIsValidValue(tmpValue);

    const handleDecrease = () => {
        if (!isValidTmpValue || tmpValue === undefined) {
            return;
        }
        const newValue = tmpValue - step;
        setTmpValue(newValue);
        onValue(newValue);
    };

    const handleIncrease = () => {
        if (!isValidTmpValue || tmpValue === undefined) {
            return;
        }
        const newValue = tmpValue + step;
        setTmpValue(newValue);
        onValue(newValue);
    };

    const handleInputChange = (newValue: string) => {
        if (newValue === '') {
            setTmpValue(undefined);
            return;
        }
        const newIntValue = parseInt(newValue, 10);
        setTmpValue(newIntValue);
        if (getIsValidValue(newIntValue)) {
            onValue(newIntValue);
        }
    };

    return (
        <div className={clsx('border rounded shrink-0 flex flex-nowrap', className)} {...rest}>
            <button
                type="button"
                title={c('Action').t`Decrease`}
                className={clsx(['p-2 flex', isDecDisabled && 'color-disabled'])}
                disabled={isDecDisabled}
                onClick={handleDecrease}
            >
                <Icon name="minus" alt={c('Action').t`Decrease`} className="m-auto" />
            </button>
            <label htmlFor={id} className="my-2 flex">
                <input
                    autoComplete="off"
                    min={min}
                    max={max}
                    value={tmpValue}
                    id={id}
                    className="w-custom border-left border-right text-center"
                    style={{ '--w-custom': '6em' }}
                    onBlur={() => {
                        if (!isValidTmpValue) {
                            // Revert to the latest valid value upon blur
                            setTmpValue(value);
                        }
                    }}
                    onChange={({ target: { value: newValue } }) => handleInputChange(newValue)}
                />
            </label>
            <button
                type="button"
                title={c('Action').t`Increase`}
                className={clsx(['p-2 flex', isIncDisabled && 'color-disabled'])}
                disabled={isIncDisabled}
                onClick={handleIncrease}
            >
                <Icon name="plus" alt={c('Action').t`Increase`} className="m-auto" />
            </button>
        </div>
    );
};

export default ButtonNumberInput;
