import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

import Icon from '../icon/Icon';

const Checkbox = ({ id, checked, indeterminate, ...rest }) => {
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    return (
        <label htmlFor={id}>
            <input ref={inputRef} id={id} type="checkbox" className="pm-checkbox" checked={checked} {...rest} />
            <span className="pm-checkbox-fakecheck">
                <Icon className="pm-checkbox-fakecheck-img" name="on" />
            </span>
        </label>
    );
};

Checkbox.propTypes = {
    id: PropTypes.string,
    checked: PropTypes.bool.isRequired,
    indeterminate: PropTypes.bool
};

Checkbox.defaultProps = {
    indeterminate: false
};

export default Checkbox;
