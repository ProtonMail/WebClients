import type { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes, Ref } from 'react';
import { forwardRef } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { IconComponent } from '@proton/icons/component';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';
import clsx from '@proton/utils/clsx';

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
    const label = (Icon: IconComponent, condition: boolean) => {
        return (
            <span className="toggle-container-text" aria-hidden="true">
                <Icon alt="" size={4} className="toggle-container-img" />
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
                {label(IcCross, loading && !checked)}
                {label(IcCheckmark, loading && checked)}
            </div>
            {children}
        </label>
    );
};

export default forwardRef<HTMLInputElement, ToggleProps>(Toggle);
