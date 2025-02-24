import type { ReactNode } from 'react';

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
    // If we dont have marginBottom or vertical margin in className, let's add default one
    const defaultMarginBottom = ['mb', 'my'].every((marginMatch) => !className?.includes(marginMatch)) ? 'mb-2' : '';
    // If we dont have marginRight or horizontal margin in className, let's add default one
    const defaultMarginRight = ['mr', 'mx'].every((marginMatch) => !className?.includes(marginMatch)) ? 'mr-8' : '';

    return (
        <>
            {options.map((option, i) => (
                <Radio
                    id={`${name}-radio_${i}`}
                    key={option.value}
                    onChange={() => {
                        if (disableChange) {
                            return;
                        }

                        onChange(option.value);
                    }}
                    checked={value === option.value}
                    name={name}
                    className={clsx('inline-flex *:self-center', defaultMarginRight, defaultMarginBottom, className)}
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
