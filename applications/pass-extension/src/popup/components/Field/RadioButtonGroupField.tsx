import { Children, type FC, type ReactElement, type ReactNode, cloneElement } from 'react';

import { type FieldProps } from 'formik';

import { Icon, type IconName, InputButton, InputFieldTwo } from '@proton/components';
import { type InputFieldProps } from '@proton/components/components/v2/field/InputField';
import type { MaybeArray } from '@proton/pass/types';
import { type ColorRGB } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { useFieldControl } from '../../hooks/useFieldControl';

import './RadioButtonGroupField.scss';

type BaseRadioProps<T> = {
    checked?: boolean;
    disabled?: boolean;
    id?: string;
    name?: string;
    onChange?: (value: T) => void;
    value: T;
};

type RadioValue = string | number | readonly string[];

type RadioButtonProps<T> = BaseRadioProps<T> & { color?: ColorRGB; icon?: IconName };

export const RadioButton = <T,>({ onChange, id, checked, value, name, color, icon }: RadioButtonProps<T>) => {
    return (
        <InputButton
            type="radio"
            id={id}
            name={name}
            checked={checked}
            onChange={(e) => e.target.checked && onChange?.(value)}
            labelProps={{
                className: 'pass-radio-group--button',
                style: { '--radio-button-background': color ? `rgb(${color})` : 'var(--background-weak)' },
            }}
        >
            {icon && <Icon name={icon} size={20} />}
        </InputButton>
    );
};

type RadioLabelledButtonProps<T> = BaseRadioProps<T> & { children: MaybeArray<ReactNode> };

export const RadioLabelledButton = <T extends RadioValue>({
    id,
    name,
    disabled,
    value,
    checked,
    onChange,
    children,
}: RadioLabelledButtonProps<T>) => {
    return (
        <label
            htmlFor={id}
            className={clsx([
                'pass-radio-group--labelled-button w100 increase-click-surface relative',
                disabled && 'opacity-50 no-pointer-events',
            ])}
        >
            <input
                id={id}
                type="radio"
                className="radio"
                name={name}
                disabled={disabled}
                value={value}
                onChange={(e) => e.target.checked && onChange?.(value)}
            />
            <div className="flex flex-align-items-center gap-x-3 py-4">
                {children}
                {checked && <Icon name="checkmark" size={24} color="var(--interaction-norm)" />}
            </div>
        </label>
    );
};

type RadioButtonGroupProps<T> = {
    children: ReactElement<BaseRadioProps<T>>[];
    className?: string;
    name: string;
    onChange?: (value: T) => void;
    value?: T;
};

export const RadioButtonGroup = <T extends RadioValue>(props: RadioButtonGroupProps<T>) => {
    const radioButtons = Children.map(props.children, (child, id) => {
        return cloneElement(child, {
            checked: props.value === child.props.value,
            id: `${props.name}-${id}`,
            name: props.name,
            onChange: props.onChange,
        });
    });

    return <div className={clsx('flex', props.className)}>{radioButtons}</div>;
};

type RadioButtonGroupFieldProps = FieldProps & InputFieldProps<typeof RadioButtonGroup>;

export const RadioButtonGroupField: FC<RadioButtonGroupFieldProps> = ({ field, form, meta, onChange, ...props }) => {
    const { error } = useFieldControl({ field, form, meta });

    return (
        <InputFieldTwo<typeof RadioButtonGroup>
            as={RadioButtonGroup}
            assistContainerClassName="hidden-empty"
            error={error}
            {...field}
            {...props}
            onChange={(value: RadioValue) => {
                onChange?.(value);
                form.setFieldValue(field.name, value);
            }}
        />
    );
};
