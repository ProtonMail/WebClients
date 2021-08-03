import { ChangeEvent } from 'react';
import * as React from 'react';

import Icon from '../icon/Icon';
import { classnames } from '../../helpers';
import { CircleLoader } from '../loader';

export interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    loading?: boolean;
}

const Toggle = (
    { id = 'toggle', className = '', checked = false, loading = false, onChange, disabled, title, ...rest }: Props,
    ref: React.Ref<HTMLInputElement>
) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!disabled && onChange) {
            onChange(event);
        }
    };
    const label = (name: string, condition: boolean) => {
        return (
            <span className="toggle-label-text" aria-hidden="true">
                <Icon name={name} alt="" size={16} className="toggle-label-img" />
                {condition && (
                    <span className="toggle-label-loader">
                        <CircleLoader />
                    </span>
                )}
            </span>
        );
    };
    return (
        <label
            htmlFor={id}
            className={classnames([
                'toggle-label',
                className,
                disabled && 'toggle-label--disabled',
                checked && 'toggle-label--checked',
                loading && 'toggle-label--loading',
            ])}
            title={title}
        >
            <input
                disabled={loading || disabled}
                id={id}
                onChange={handleChange}
                type="checkbox"
                className={classnames(['toggle-checkbox sr-only', className])}
                checked={checked}
                aria-busy={loading}
                ref={ref}
                {...rest}
            />
            {label('off', loading && !checked)}
            {label('on', loading && checked)}
        </label>
    );
};

export default React.forwardRef<HTMLInputElement, Props>(Toggle);
