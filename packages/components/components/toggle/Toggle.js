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

const Toggle = (props) => {
    return (
        <>
            <input {...props} type="checkbox" className="pm-toggle-checkbox" />
            <label htmlFor={props.id} className="pm-toggle-label">
                {label('on')}
                {label('off')}
            </label>
        </>
    );
};

Toggle.propTypes = {
    id: PropTypes.string.isRequired,
    checked: PropTypes.bool.isRequired,
    onChange: PropTypes.func.isRequired
};

Toggle.defaultProps = {
    id: 'toggle',
    checked: false
};

export default Toggle;
