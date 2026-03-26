import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import type { Input } from '@proton/atoms/Input/Input';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import type { InputFieldProps } from '@proton/components/components/v2/field/InputField';
import type { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { formatTimeHHMM } from '../../utils/timeFormat';

import './TimeInput.scss';

const normaliseInput = (time: string): string | null => {
    const match = time.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(\s?(AM|PM))?$/i);
    if (!match) {
        return null;
    }
    let hours = parseInt(match[1]);
    const period = match[4]?.toUpperCase();
    if (period === 'PM' && hours < 12) {
        hours += 12;
    } else if (period === 'AM' && hours === 12) {
        hours = 0;
    }
    return `${String(hours).padStart(2, '0')}:${match[2]}`;
};

export const TimeInput = ({
    value,
    onChange,
    placeholder,
    className,
    error,
    options,
    timeFormat,
    ...rest
}: Omit<InputFieldProps<typeof Input>, 'onChange' | 'value'> & {
    onChange: (value: string) => void;
    value: string;
    options: { value: string; label: string }[];
    timeFormat: SETTINGS_TIME_FORMAT;
}) => {
    const currentPlaceholder = placeholder || c('Placeholder').t`Enter time`;

    const [isOpen, setIsOpen] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [inputBuffer, setInputBuffer] = useState('');
    const skipBlurRef = useRef(false);
    const anchorRef = useRef<HTMLInputElement>(null);
    const activeButtonRef = useRef<HTMLButtonElement>(null);

    const activeOption = options.find((option) => option.value >= value);

    const displayValue = (() => {
        if (!value) {
            return '';
        }
        const [hours, minutes] = value.split(':');
        // date is irrelevant and is picked randomly, we only need the time part
        const date = new Date(2024, 0, 1, parseInt(hours), parseInt(minutes), 0, 0);
        return formatTimeHHMM(date, timeFormat);
    })();

    useEffect(() => {
        if (isOpen && activeButtonRef.current) {
            activeButtonRef.current.scrollIntoView({ block: 'center' });
        }
    }, [isOpen]);

    const handleOptionClick = (option: string) => {
        skipBlurRef.current = true;
        onChange(option);
        setIsOpen(false);
    };

    const handleFocus = () => {
        setIsFocused(true);
        setInputBuffer(displayValue);
    };

    const handleBlur = () => {
        setIsFocused(false);
        if (skipBlurRef.current) {
            skipBlurRef.current = false;
            return;
        }
        const normalised = normaliseInput(inputBuffer);
        if (normalised) {
            onChange(normalised);
        }
        // if invalid, silently revert — buffer resets to displayValue on next focus
    };

    return (
        <div className={clsx('relative', className)}>
            <InputFieldTwo
                ref={anchorRef}
                value={isFocused ? inputBuffer : displayValue}
                onClick={() => setIsOpen(true)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={(e) => setInputBuffer(e.target.value)}
                placeholder={currentPlaceholder}
                autoComplete="off"
                error={error || (value && !normaliseInput(value))}
                {...rest}
            />
            <Dropdown
                isOpen={isOpen}
                anchorRef={anchorRef}
                onClose={() => setIsOpen(false)}
                className="create-container-dropdown z-10 w-custom"
                style={{ '--w-custom': '8.875rem' }}
                originalPlacement="bottom-start"
                availablePlacements={['bottom-start']}
                disableFocusTrap={true}
            >
                <div className="flex flex-column max-h-custom" style={{ '--max-h-custom': '15rem' }}>
                    <div className="overflow-y-auto w-full h-full p-2">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                ref={activeOption?.value === option.value ? activeButtonRef : null}
                                type="button"
                                className={clsx(
                                    'time-input-option text-left px-3 py-2 rounded-sm outline-none w-full rounded-xl',
                                    activeOption?.value === option.value && 'time-input-active-option'
                                )}
                                onMouseDown={() => handleOptionClick(option.value)}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            </Dropdown>
        </div>
    );
};
