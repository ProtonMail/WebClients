import React, { ChangeEvent } from 'react';

import Icon from '../icon/Icon';
import { classnames } from '../../helpers';

export enum ToggleState {
    on = 'on',
    off = 'off',
}
export interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    loading?: boolean;
    label?: (key: ToggleState) => void;
}

const Toggle = ({
    id = 'toggle',
    className = '',
    checked = false,
    loading = false,
    onChange,
    disabled,
    title,
    label = (key: ToggleState) => {
        return (
            <span className="toggle-label-text" aria-hidden="true">
                <Icon name={key} alt="" size={16} className="toggle-label-img" />
            </span>
        );
    },
    ...rest
}: Props) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!disabled && onChange) {
            onChange(event);
        }
    };
    return (
        <>
            <input
                disabled={loading ? true : disabled}
                id={id}
                onChange={handleChange}
                type="checkbox"
                className={classnames(['toggle-checkbox', className])}
                checked={checked}
                aria-busy={loading}
                {...rest}
            />
            <label htmlFor={id} className={classnames(['toggle-label', className])} title={title}>
                {label(ToggleState.off)}
                {label(ToggleState.on)}
            </label>
        </>
    );
};

export default Toggle;
