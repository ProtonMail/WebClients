import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import type { Input } from '@proton/atoms';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import type { InputFieldProps } from '@proton/components/components/v2/field/InputField';
import clsx from '@proton/utils/clsx';

import './TimeInput.scss';

const validateTimeFormat = (time: string) => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(time);
};

export const TimeInput = ({
    value,
    onChange,
    placeholder,
    className,
    error,
    options,
    ...rest
}: Omit<InputFieldProps<typeof Input>, 'onChange' | 'value'> & {
    onChange: (value: string) => void;
    value: string;
    options: { value: string; label: string }[];
}) => {
    const currentPlaceholder = placeholder || c('Placeholder').t`Enter time`;

    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLInputElement>(null);
    const activeButtonRef = useRef<HTMLButtonElement>(null);

    const activeOption = options.find((option) => option.value >= value);

    useEffect(() => {
        if (isOpen && activeButtonRef.current) {
            activeButtonRef.current.scrollIntoView({ block: 'center' });
        }
    }, [isOpen]);

    const handleOptionClick = (option: string) => {
        onChange?.(option);
        setIsOpen(false);
    };

    return (
        <div className={clsx('relative', className)}>
            <InputFieldTwo
                ref={anchorRef}
                value={value}
                onClick={() => setIsOpen(true)}
                onChange={(e) => onChange(e.target.value)}
                placeholder={currentPlaceholder}
                autoComplete="off"
                error={error || (value && !validateTimeFormat(value))}
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
