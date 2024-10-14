import { useState } from 'react';

import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Checkbox from '@proton/components/components/input/Checkbox';
import Label from '@proton/components/components/label/Label';
import type { CountryOptions } from '@proton/components/helpers/countries';
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
}: {
    step?: number;
    id: string;
    min?: number;
    max?: number;
    value: number | undefined;
    disabled?: boolean;
    location: GatewayLocation;
    countryOptions: CountryOptions;
    onChange?: (newValue: number) => void;
}) => {
    const [tmpValue, setTmpValue] = useState<number | undefined>(value);

    const getIsValidValue = (newValue?: number) => {
        return newValue !== undefined && newValue >= min && newValue <= max && newValue % step === 0;
    };

    const title = getLocationDisplayName(location, countryOptions);

    const isDecDisabled = disabled || !getIsValidValue((tmpValue || 0) - step);
    const isIncDisabled = disabled || !getIsValidValue((tmpValue || 0) + step);

    const isValidTmpValue = getIsValidValue(tmpValue);

    return (
        <>
            <Label className="flex-1" style={{ opacity: disabled ? 0.5 : 1 }}>
                <Checkbox
                    onChange={(e) => {
                        const newValue = e.target.checked ? 1 : undefined;
                        setTmpValue(newValue);
                        onChange?.(newValue || 0);
                    }}
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
                        setTmpValue?.(newValue);
                        onChange?.(newValue);
                    }}
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
                        onChange={({ target: { value: newValue } }) => {
                            if (newValue === '') {
                                setTmpValue?.(undefined);
                                return;
                            }
                            const newIntValue = parseInt(newValue, 10);
                            setTmpValue?.(newIntValue);
                            if (getIsValidValue(newIntValue)) {
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
                        setTmpValue?.(newValue);
                        onChange?.(newValue);
                    }}
                >
                    <Icon name="plus" alt={c('Action').t`Increase`} className="m-auto" />
                </button>
            </div>
        </>
    );
};
