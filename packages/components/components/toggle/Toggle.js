import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';

import Checkbox from '../input/Checkbox';
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

const Toggle = ({ id, checked, onChange }) => {
    const [value, setValue] = useState(checked);
    const handleChange = ({ target }) => {
        const newVal = target.checked;
        setValue(newVal);
        onChange(newVal);
    };

    return (
        <>
            <Checkbox id={id} checked={value} className="pm-toggle-checkbox" onChange={handleChange} />
            <label htmlFor={id} className="pm-toggle-label">
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
