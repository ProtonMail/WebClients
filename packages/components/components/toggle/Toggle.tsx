import { ChangeEvent, DetailedHTMLProps, forwardRef, InputHTMLAttributes, Ref } from 'react';

import Icon, { IconName } from '../icon/Icon';
import { classnames } from '../../helpers';
import { CircleLoader } from '../loader';

export interface Props extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    loading?: boolean;
}

const Toggle = (
    { id = 'toggle', className = '', checked = false, loading = false, onChange, disabled, title, ...rest }: Props,
    ref: Ref<HTMLInputElement>
) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!disabled && onChange) {
            onChange(event);
        }
    };
    const label = (name: IconName, condition: boolean) => {
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
            {label('cross', loading && !checked)}
            {label('checkmark', loading && checked)}
        </label>
    );
};

export default forwardRef<HTMLInputElement, Props>(Toggle);
