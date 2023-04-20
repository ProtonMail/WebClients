import { Children, type ReactElement, ReactNode, cloneElement } from 'react';

import { Icon, type IconName, InputButton } from '@proton/components';
import type { ColorRGB, MaybeArray } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './RadioButtonGroup.scss';

type BaseRadioProps<T> = {
    value: T;
    onChange?: (value: T) => void;
    checked?: boolean;
    id?: string;
    name?: string;
    disabled?: boolean;
};

export type RadioValue = string | number | readonly string[];
type RadioButtonProps<T> = BaseRadioProps<T> & { color?: ColorRGB; icon?: IconName };
type RadioLabelledButtonProps<T> = BaseRadioProps<T> & { children: MaybeArray<ReactNode> };

type Props<T> = {
    value?: T;
    onValue?: (value: T) => void;
    children: ReactElement<BaseRadioProps<T>>[];
    name: string;
    className?: string;
};

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

export const RadioButtonGroup = <T extends RadioValue>(props: Props<T>) => {
    const items = Children.map(props.children, (child, id) => {
        return cloneElement(child, {
            onChange: (value: T) => props.onValue?.(value),
            checked: props.value === child.props.value,
            name: props.name,
            id: `${props.name}-${id}`,
        });
    });

    return <div className={clsx('flex', props.className)}>{items}</div>;
};
