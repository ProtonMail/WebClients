import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import Radio from './Radio';

export interface RadioGroupProps<T> {
    name: string;
    options: {
        value: T;
        label: ReactNode;
        disabled?: boolean;
    }[];
    onChange: (value: T) => void;
    value: T | undefined;
    className?: string;
    ariaDescribedBy?: string;
    disableChange?: boolean;
}

const RadioGroup = <T extends string | number>({
    name,
    options,
    onChange,
    value,
    className,
    ariaDescribedBy,
    disableChange,
}: RadioGroupProps<T>) => {
    return (
        <>
            {options.map((option) => (
                <Radio
                    id={`${option.value}`}
                    key={option.value}
                    onChange={() => {
                        if (disableChange) {
                            return;
                        }

                        onChange(option.value);
                    }}
                    checked={value === option.value}
                    name={name}
                    className={clsx('inline-flex children-self-center mr-8 mb-2', className)}
                    disabled={option.disabled}
                    aria-describedby={ariaDescribedBy}
                >
                    {option.label}
                </Radio>
            ))}
        </>
    );
};

export default RadioGroup;
