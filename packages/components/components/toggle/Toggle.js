import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import Icon from '../icon/Icon';

const label = (key) => {
    const I18N = {
        on: c('Toggle button').t`On`,
        off: c('Toggle button').t`Off`
    };

    return (
        <span className="pm-toggle-label-text">
            <Icon name={key} alt={I18N[key]} className="pm-toggle-label-img" />
        </span>
    );
};

const Toggle = ({ id, className, checked, onChange, disabled, ...rest }) => {
    return (
        <>
            <input
                disabled={disabled}
                id={id}
                onChange={onChange}
                type="checkbox"
                className="pm-toggle-checkbox"
                checked={checked}
                {...rest}
            />
            <label htmlFor={id} className={`pm-toggle-label ${className}`}>
                {label('off')}
                {label('on')}
            </label>
        </>
    );
};

Toggle.propTypes = {
    id: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string,
    disabled: PropTypes.bool
};

Toggle.defaultProps = {
    id: 'toggle',
    className: '',
    checked: false
};

export default Toggle;
