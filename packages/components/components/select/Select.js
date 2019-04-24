import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID } from '../../helpers/component';
import useInput from '../input/useInput';
import ErrorZone from '../text/ErrorZone';

const Select = ({ options, disabled, className, onChange, onBlur, onFocus, error, ...rest }) => {
    const { blur, focus, change, statusClasses, status } = useInput();
    const [uid] = useState(generateUID('select'));

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

    return (
        <>
            <select
                className={`pm-field w100 ${className} ${statusClasses}`}
                onBlur={handleBlur}
                onFocus={handleFocus}
                onChange={handleChange}
                {...rest}
            >
                {options.map(({ text, ...rest }, index) => (
                    <option key={index.toString()} {...rest}>
                        {text}
                    </option>
                ))}
            </select>
            <ErrorZone id={uid}>{error && status.dirty ? error : ''}</ErrorZone>
        </>
    );
};

Select.propTypes = {
    error: PropTypes.string,
    disabled: PropTypes.bool,
    size: PropTypes.number.isRequired,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    multiple: PropTypes.bool,
    className: PropTypes.string
};

Select.defaultProps = {
    multiple: false,
    className: '',
    size: 1
};

export default Select;
