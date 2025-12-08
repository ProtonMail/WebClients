import { useState } from 'react';

import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import { IcMinus } from '@proton/icons/icons/IcMinus';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import type { CountryOptions } from '@proton/payments';
import clsx from '@proton/utils/clsx';

import { CountryFlagAndName } from './CountryFlagAndName';
import type { GatewayLocation } from './GatewayLocation';
import { getLocationDisplayName } from './helpers';

export const ButtonNumberInput = ({
    value,
    onChange,
    id,
    min = 0,
    max = 999,
    step = 1,
    disabled = false,
    location,
    countryOptions,
    ownedCount,
    usedCount,
}: {
    step?: number;
    id: string;
    min?: number;
    max?: number;
    value: number | undefined;
    disabled?: boolean;
    location: GatewayLocation;
    countryOptions: CountryOptions;
    ownedCount: number;
    usedCount: number;
    onChange?: (newValue: number) => void;
}) => {
    const [tmpValue, setTmpValue] = useState<number | undefined>(value);

    const getIsValidValue = (newValue?: number) => {
        return newValue !== undefined && newValue >= min && newValue <= max && newValue % step === 0;
    };

    const title = getLocationDisplayName(location, countryOptions);

    const maxUsable = Math.min(max, ownedCount - usedCount);
    const isDecDisabled = disabled || tmpValue === undefined || tmpValue <= min;
    const isIncDisabled = disabled || tmpValue === undefined || tmpValue >= maxUsable;

    const isValidTmpValue = getIsValidValue(tmpValue);

    const setTmpNum = (newValue: number) => {
        if (newValue >= min && newValue <= maxUsable) {
            setTmpValue(newValue);
            onChange?.(newValue);
        }
    };

    return (
        <>
            <Label className="flex-1" style={{ opacity: disabled ? 0.5 : 1 }}>
                <Checkbox
                    onChange={(e) => {
                        const newValue = e.target.checked ? 1 : undefined;
                        setTmpValue(newValue);
                        onChange?.(newValue || 0);
                    }}
                    disabled={disabled}
                    checked={(tmpValue || 0) > 0}
                />{' '}
                <CountryFlagAndName countryCode={location.Country} countryName={title} />
            </Label>
            <div
                className="border rounded shrink-0 flex flex-nowrap"
                style={{ visibility: tmpValue === undefined ? 'hidden' : 'visible', opacity: disabled ? 0.5 : 1 }}
            >
                <button
                    type="button"
                    title={c('Action').t`Decrease`}
                    className={clsx(['p-2 flex', isDecDisabled && 'color-disabled'])}
                    disabled={isDecDisabled}
                    onClick={() => {
                        if (!isValidTmpValue || tmpValue === undefined) {
                            return;
                        }
                        const newValue = tmpValue - step;
                        setTmpNum?.(newValue);
                        onChange?.(newValue);
                    }}
                >
                    <IcMinus alt={c('Action').t`Decrease`} className="m-auto" />
                </button>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
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
                        onChange={({ target: { value: newValue } }) => {
                            if (newValue === '') {
                                setTmpValue(undefined);
                                return;
                            }
                            const newIntValue = parseInt(newValue, 10);
                            setTmpValue(newIntValue);
                            if (newIntValue >= min && newIntValue <= maxUsable) {
                                onChange?.(newIntValue);
                            }
                        }}
                    />
                </label>
                <button
                    type="button"
                    title={c('Action').t`Increase`}
                    className={clsx(['p-2 flex', isIncDisabled && 'color-disabled'])}
                    disabled={isIncDisabled}
                    onClick={() => {
                        if (!isValidTmpValue || tmpValue === undefined) {
                            return;
                        }
                        const newValue = tmpValue + step;
                        setTmpNum?.(newValue);
                        onChange?.(newValue);
                    }}
                >
                    <IcPlus alt={c('Action').t`Increase`} className="m-auto" />
                </button>
            </div>
        </>
    );
};
