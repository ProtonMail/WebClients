import React, { useState } from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';

import { generateUID } from '../../helpers/component';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';

const TextArea = ({ className, disabled, onPressEnter, onKeyDown, onChange, onFocus, onBlur, error, ...rest }) => {
    const { blur, change, focus, statusClasses, status } = useInput();
    const [uid] = useState(generateUID('textarea'));

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
            <textarea
                className={`pm-field w100 ${className} ${statusClasses}`}
                aria-invalid={error && status.dirty}
                aria-describedby={uid}
                onBlur={handleBlur}
                onChange={handleChange}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                {...rest}
            />
            <ErrorZone id={uid}>{error && status.dirty ? error : null}</ErrorZone>
        </>
    );
};

TextArea.propTypes = {
    error: PropTypes.string,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    id: PropTypes.string,
    onKeyDown: PropTypes.func,
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
    rows: 5,
    className: ''
};

export default TextArea;
