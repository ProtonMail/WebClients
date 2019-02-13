import React from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';
import { getClasses } from '../../helpers/component';

const Input = ({ className, disabled, onPressEnter, onKeyDown, onFocus, ...rest }) => {
    const handleFocus = (event) => {
        if (disabled) {
            return;
        }

        if (onFocus) {
            onFocus(event);
        }
    };

    const handleKeyDown = (event) => {
        const key = keycode(event);

        if (key === 'enter' && onPressEnter) {
            onPressEnter(event);
        }

        if (onKeyDown) {
            onKeyDown(event);
        }
    };

    return (
        <input
            className={getClasses('pm-field', className)}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            {...rest}
        />
    );
};

Input.propTypes = {
    autoComplete: PropTypes.string,
    autoFocus: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    id: PropTypes.string,
    inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    name: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onKeyDown: PropTypes.func,
    onKeyUp: PropTypes.func,
    onPressEnter: PropTypes.func,
    placeholder: PropTypes.string,
    readOnly: PropTypes.bool,
    required: PropTypes.bool,
    type: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
};

Input.defaultProps = {
    type: 'text'
};

export default Input;