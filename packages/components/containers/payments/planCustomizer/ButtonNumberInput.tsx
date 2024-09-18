import { useState } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import clsx from '@proton/utils/clsx';

import type { DecreaseBlockedReason } from './helpers';

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
    decreaseBlockedReasons,
}: {
    step?: number;
    id: string;
    min?: number;
    max?: number;
    value: number;
    disabled?: boolean;
    onChange?: (newValue: number) => void;
    decreaseBlockedReasons: DecreaseBlockedReason[];
}) => {
    const [tmpValue, setTmpValue] = useState<number | null | undefined>(undefined);

    const handleOnChange = (value: number) => {
        if (getIsValidValue(min, max, step, value)) {
            setTmpValue(undefined);
            onChange?.(value);
        } else {
            setTmpValue(value);
        }
    };

    const currentValue = Number(tmpValue ?? value);

    const handleAddition = (diff: number) => {
        handleOnChange(currentValue + step * diff);
    };

    const isDecDisabled = disabled || !getIsValidValue(min, max, step, currentValue - step);
    const isIncDisabled = disabled || !getIsValidValue(min, max, step, currentValue + step);

    const decreaseBlockedReason = decreaseBlockedReasons[0] ?? null;
    const reasonText =
        decreaseBlockedReason === 'forbidden-modification'
            ? c('Payments').t`Please reactivate your subscription first to decrease the number of add-ons.`
            : null;

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
                {!decreaseBlockedReason && <Icon name="minus" alt={c('Action').t`Decrease`} className="m-auto" />}
            </button>
            {decreaseBlockedReason && (
                <span
                    className="mr-2 mt-1 ml-custom"
                    style={{
                        '--ml-custom': 'calc(var(--space-1) * -1)',
                    }}
                >
                    <Info title={reasonText} className="mt-1" />
                </span>
            )}
            <label htmlFor={id} className="my-2 flex">
                <input
                    autoComplete="off"
                    min={min}
                    max={max}
                    value={tmpValue === null ? '' : currentValue}
                    id={id}
                    type="number"
                    className="w-custom border-left border-right text-center invisible-number-input-arrow"
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
