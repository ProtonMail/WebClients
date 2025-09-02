import type { ReactNode } from 'react';

import type { FieldProps } from 'formik';

import { InputFieldTwo, Radio } from '@proton/components';
import type { InputFieldProps } from '@proton/components/components/v2/field/InputField';
import clsx from '@proton/utils/clsx';

import { useFieldControl } from '../../../hooks/useFieldControl';

export type RadioValue = string | number | readonly string[];

type RadioGroupProps<T extends RadioValue> = {
    className?: string;
    disabled?: boolean;
    name: string;
    options: { label: ReactNode; value: T; disabled?: boolean }[];
    value?: T;
    onChange?: (value: T) => void;
};

const RadioGroup = <T extends RadioValue>({
    className,
    disabled,
    name,
    options,
    value,
    onChange,
}: RadioGroupProps<T>) => {
    const handleChange = (value: T) => () => onChange?.(value);

    return (
        <>
            {options.map((option, i) => (
                <Radio
                    key={i}
                    id={`${name}[${i}]`}
                    onChange={handleChange(option.value)}
                    checked={value === option.value}
                    name={name}
                    className={clsx(['mr-8', 'mb-2', 'flex', className])}
                    disabled={disabled || option.disabled}
                >
                    {option.label}
                </Radio>
            ))}
        </>
    );
};

type RadioGroupFieldProps<T extends RadioValue> = FieldProps & InputFieldProps<typeof RadioGroup<T>>;

export const RadioGroupField = <T extends RadioValue>({
    field,
    form,
    meta,
    onChange,
    ...props
}: RadioGroupFieldProps<T>) => {
    const { error } = useFieldControl({ field, form, meta });

    return (
        <InputFieldTwo<typeof RadioGroup<T>>
            as={RadioGroup}
            assistContainerClassName="empty:hidden"
            error={error}
            {...field}
            {...props}
            onChange={async (value: T) => {
                await form.setFieldValue(field.name, value);
                onChange?.(value);
            }}
        />
    );
};
