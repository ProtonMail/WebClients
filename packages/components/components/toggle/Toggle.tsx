import React, { ChangeEvent } from 'react';
import { c } from 'ttag';

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
        const alt = key === ToggleState.on ? c('Toggle button').t`On` : c('Toggle button').t`Off`;
        return (
            <span className="pm-toggle-label-text">
                <Icon name={key} alt={alt} className="pm-toggle-label-img" />
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
                className="pm-toggle-checkbox"
                checked={checked}
                aria-busy={loading}
                {...rest}
            />
            <label htmlFor={id} className={classnames(['pm-toggle-label', className])} title={title}>
                {label(ToggleState.off)}
                {label(ToggleState.on)}
            </label>
        </>
    );
};

export default Toggle;
