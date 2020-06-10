import React, { ChangeEvent } from 'react';
import { c } from 'ttag';

import Icon from '../icon/Icon';
import { classnames } from '../../helpers/component';

const label = (key: string) => {
    const alt = key === 'on' ? c('Toggle button').t`On` : c('Toggle button').t`Off`;
    return (
        <span className="pm-toggle-label-text">
            <Icon name={key} alt={alt} className="pm-toggle-label-img" />
        </span>
    );
};

export interface Props extends React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
    loading?: boolean;
}

const Toggle = ({
    id = 'toggle',
    className = '',
    checked = false,
    loading = false,
    onChange,
    disabled,
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
            <label htmlFor={id} className={classnames(['pm-toggle-label', className])}>
                {label('off')}
                {label('on')}
            </label>
        </>
    );
};

export default Toggle;
