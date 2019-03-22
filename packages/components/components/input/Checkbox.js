import React from 'react';
import PropTypes from 'prop-types';

import Input from './Input';
import Icon from '../icon/Icon';

const Checkbox = ({ id, checked, ...rest }) => {
    return (
        <label htmlFor={id}>
            <Input id={id} type="checkbox" className="pm-checkbox" checked={checked} {...rest} />
            <span className="pm-checkbox-fakecheck">
                <Icon className="pm-checkbox-fakecheck-img" name="on" />
            </span>
        </label>
    );
};

Checkbox.propTypes = {
    id: PropTypes.string,
    checked: PropTypes.bool.isRequired
};

export default Checkbox;
