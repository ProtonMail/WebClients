import { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes, Ref, forwardRef } from 'react';

import { CircleLoader } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import Icon, { IconName } from '../icon/Icon';

export interface ToggleProps extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    loading?: boolean;
}

const Toggle = (
    {
        id = 'toggle',
        className = '',
        checked = false,
        loading = false,
        onChange,
        disabled,
        title,
        children,
        ...rest
    }: ToggleProps,
    ref: Ref<HTMLInputElement>
) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!disabled && onChange) {
            onChange(event);
        }
    };
    const label = (name: IconName, condition: boolean) => {
        return (
            <span className="toggle-container-text" aria-hidden="true">
                <Icon name={name} alt="" size={4} className="toggle-container-img" />
                {condition && (
                    <span className="toggle-container-loader">
                        <CircleLoader />
                    </span>
                )}
            </span>
        );
    };
    return (
        <label
            className={clsx([children ? 'flex items-center flex-nowrap gap-2' : '', 'toggle-label', className])}
            htmlFor={id}
            data-testid="toggle-switch"
            title={title}
        >
            <div
                className={clsx([
                    'toggle-container',
                    disabled && 'toggle-container--disabled',
                    checked && 'toggle-container--checked',
                    loading && 'toggle-container--loading',
                ])}
            >
                <input
                    disabled={loading || disabled}
                    id={id}
                    onChange={handleChange}
                    type="checkbox"
                    className={clsx(['toggle-checkbox sr-only', className])}
                    checked={checked}
                    aria-busy={loading}
                    ref={ref}
                    {...rest}
                />
                {label('cross', loading && !checked)}
                {label('checkmark', loading && checked)}
            </div>
            {children}
        </label>
    );
};

export default forwardRef<HTMLInputElement, ToggleProps>(Toggle);
