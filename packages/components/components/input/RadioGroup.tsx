import { Key, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import Radio from './Radio';

export interface Props<T> {
    name: string;
    options: {
        key?: Key;
        value: T;
        label: ReactNode;
        disabled?: boolean;
    }[];
    onChange: (value: T) => void;
    value: T;
    className?: string;
    ['aria-describedby']?: string;
}

const RadioGroup = <T,>({
    name,
    options,
    onChange,
    value,
    className,
    'aria-describedby': ariaDescribedBy,
}: Props<T>) => {
    return (
        <>
            {options.map((option, i) => (
                <Radio
                    key={option.key || `${i}`}
                    id={`${name}-radio_${i}`}
                    onChange={() => onChange(option.value)}
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
