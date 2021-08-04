import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import InputTwo, { InputTwoProps } from '../input/Input';
import {
    getCountries,
    getCountryFromNumber,
    getCursorPosition,
    getExamplePlaceholder,
    getFormattedValue,
    getNumberWithCountryCode,
    getNumberWithoutCountryCode,
    getSafeCountryCallingCode,
    getSpecificCountry,
    getSpecificMaxLength,
    getTrimmedString,
} from './helper';
import CountrySelect from './CountrySelect';

const usePreviousValue = <T,>(value: T) => {
    const ref = useRef<T>();
    useEffect(() => {
        ref.current = value;
    }, [value]);
    return ref.current;
};

export interface Props extends Omit<InputTwoProps, 'type' | 'value' | 'onChange'> {
    value: string;
    defaultCountry?: string;
    onChange: (value: string) => void;
}

const PhoneInput = ({ value: actualValue = '', defaultCountry = 'US', onChange, onValue, ...rest }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const selectionRef = useRef<number | null>(null);
    const oldSpecificCountryLengthRef = useRef<number>(0);
    const [isCountryCallingCodeMode, setIsCountryCallingCodeMode] = useState(false);
    const [oldCountry, setOldCountry] = useState(defaultCountry);

    const trimmedValue = getTrimmedString(actualValue);
    const previousTrimmedValue = usePreviousValue(trimmedValue);

    const oldCountryCallingCode = getSafeCountryCallingCode(oldCountry);
    const valueWithCountryCallingCode = getNumberWithCountryCode(trimmedValue, oldCountryCallingCode);

    const countryCodeFromValue = getCountryFromNumber(valueWithCountryCallingCode);
    const countryCallingCodeFromValue = getSafeCountryCallingCode(countryCodeFromValue);
    const valueWithoutCountryCallingCode = getNumberWithoutCountryCode(
        valueWithCountryCallingCode,
        countryCallingCodeFromValue
    );
    const [valueCountryCodeSpecific, foundLength] = getSpecificCountry(
        valueWithoutCountryCallingCode,
        countryCallingCodeFromValue,
        oldCountryCallingCode === countryCallingCodeFromValue &&
            valueWithoutCountryCallingCode.length < oldSpecificCountryLengthRef.current
            ? oldCountry
            : countryCodeFromValue
    );

    const placeholder = getNumberWithoutCountryCode(
        getExamplePlaceholder(valueCountryCodeSpecific),
        countryCallingCodeFromValue
    );

    const formattedValue = getFormattedValue(valueWithCountryCallingCode).trim();
    const formattedValueInMode = isCountryCallingCodeMode
        ? formattedValue
        : getNumberWithoutCountryCode(formattedValue, countryCallingCodeFromValue);

    const countryCode = (() => {
        // 1. Going from '' -> '+' === remove country
        const isNullToPlus = previousTrimmedValue === '' && trimmedValue === '+';
        if (isNullToPlus) {
            return '';
        }
        // 2. No country and going from '+' -> '' === add back default country
        const isEmptyCountryToNull = previousTrimmedValue === '+' && trimmedValue === '' && oldCountry === '';
        if (isEmptyCountryToNull) {
            return defaultCountry;
        }
        // 3. Guess country from number
        return valueCountryCodeSpecific || oldCountry;
    })();

    useLayoutEffect(() => {
        if (trimmedValue === '+') {
            setOldCountry('');
            return;
        }
        // Setting from country select
        if (trimmedValue !== '') {
            oldSpecificCountryLengthRef.current = foundLength;
        }
        setOldCountry(countryCode);
    }, [countryCode]);

    useLayoutEffect(() => {
        const inputEl = inputRef.current;
        const selection = selectionRef.current;
        if (!inputEl || selection === null) {
            return;
        }
        const i = getCursorPosition(selection, formattedValueInMode);
        inputEl.selectionStart = i;
        inputEl.selectionEnd = i;
        selectionRef.current = null;
    });

    const countries = useMemo(() => getCountries(), []);
    const selectedValue = countries.find((data) => data.countryCode === countryCode);

    return (
        <InputTwo
            {...rest}
            type="tel"
            value={formattedValueInMode}
            ref={inputRef}
            placeholder={placeholder}
            prefix={
                <CountrySelect
                    value={selectedValue}
                    options={countries}
                    onChange={(newSelectedValue) => {
                        oldSpecificCountryLengthRef.current = getSpecificMaxLength(
                            getSafeCountryCallingCode(newSelectedValue.countryCode),
                            newSelectedValue.countryCode
                        );
                        setIsCountryCallingCodeMode(false);
                        setOldCountry(newSelectedValue.countryCode);
                        onChange('');
                    }}
                    onClosed={(isFromSelection) => {
                        if (isFromSelection) {
                            inputRef.current?.focus();
                        }
                    }}
                />
            }
            onChange={(event) => {
                const {
                    target,
                    target: { value: newStringValue },
                } = event;
                selectionRef.current = getTrimmedString(newStringValue.slice(0, target.selectionEnd || 0)).length;
                const newTrimmedValue = getTrimmedString(newStringValue);
                setIsCountryCallingCodeMode(newTrimmedValue[0] === '+');
                const newValue = !newTrimmedValue.length
                    ? ''
                    : getNumberWithCountryCode(newTrimmedValue, countryCallingCodeFromValue);
                onChange(newValue);
            }}
        />
    );
};

export default PhoneInput;
