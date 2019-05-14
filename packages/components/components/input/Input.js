import React, { useState } from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';

import { generateUID } from '../../helpers/component';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';

const Input = ({
    className,
    disabled,
    onPressEnter,
    onKeyDown,
    onFocus,
    onChange,
    onBlur,
    error,
    inputRef,
    ...rest
}) => {
    const { focus, change, blur, statusClasses, status } = useInput();
    const [uid] = useState(generateUID('input'));

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
        <>
            <input
                disabled={disabled}
                className={`pm-field w100 ${className} ${statusClasses}`}
                aria-invalid={error && status.dirty}
                aria-describedby={uid}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onChange={handleChange}
                ref={inputRef}
                {...rest}
            />
            <ErrorZone id={uid}>{error && status.dirty ? error : ''}</ErrorZone>
        </>
    );
};

Input.propTypes = {
    error: PropTypes.string,
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
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool])
};

Input.defaultProps = {
    type: 'text',
    autoComplete: 'off',
    className: ''
};

export default Input;
