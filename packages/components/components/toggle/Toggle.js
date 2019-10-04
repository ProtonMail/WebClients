import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import Icon from '../icon/Icon';
import { classnames } from '../../helpers/component';

const label = (key) => {
    const I18N = {
        on: c('Toggle button').t`On`,
        off: c('Toggle button').t`Off`
    };

    return (
        <span className="pm-toggle-label-text">
            <Icon name={key} alt={I18N[key]} fill="none" className="pm-toggle-label-img" />
        </span>
    );
};

/**
 * @type any
 */
const Toggle = ({ id = 'toggle', className = '', checked = false, loading, onChange, disabled, ...rest }) => {
    const handleChange = (event) => {
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

Toggle.propTypes = {
    id: PropTypes.string,
    checked: PropTypes.bool,
    onChange: PropTypes.func.isRequired,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool
};

export default Toggle;
