import React from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';

import useInput from './useInput';

const Input = ({ className, disabled, onPressEnter, onKeyDown, onFocus, onChange, onBlur, ...rest }) => {
    const { focus, change, blur, statusClasses } = useInput();
    const handleFocus = (event) => {
        if (disabled) {
            return;
        }

        focus();

        if (onFocus) {
            onFocus(event);
        }
    };

    const handleBlur = (event) => {
        blur();

        if (onBlur) {
            onBlur(event);
        }
    };

    const handleChange = (event) => {
        change();

        if (onChange) {
            onChange(event);
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
        <input className={`pm-field ${className} ${statusClasses}`}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
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
    autoComplete: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
};

Input.defaultProps = {
    type: 'text',
    autoComplete: 'off'
};

export default Input;