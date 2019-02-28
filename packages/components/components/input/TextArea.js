import React from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';

import useInput from './useInput';

const TextArea = ({ className, disabled, onPressEnter, onKeyDown, onChange, onFocus, onBlur, ...rest }) => {
    const { blur, change, focus, statusClasses } = useInput();

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
        <textarea
            className={`pm-field w100 ${className} ${statusClasses}`}
            onBlur={handleBlur}
            onChange={handleChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            {...rest}
            />
    );
};

TextArea.propTypes = {
    className: PropTypes.string,
    disabled: PropTypes.bool,
    id: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    onFocus: PropTypes.func,
    onPressEnter: PropTypes.func,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    rows: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    textareaRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

TextArea.defaultProps = {
    rows: 5
};

export default TextArea;