import React from 'react';
import PropTypes from 'prop-types';
import useInput from '../input/useInput';

const Select = ({ options, disabled, className, onChange, onBlur, onFocus, ...rest }) => {
    const { blur, focus, change, statusClasses } = useInput();

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
        <select
            className={`pm-field ${className} ${statusClasses}`}
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
    );
};

Select.propTypes = {
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    options: PropTypes.arrayOf(PropTypes.object).isRequired,
    multiple: PropTypes.bool,
    className: PropTypes.string
};

Select.defaultProps = {
    multiple: false,
    className: ''
};

export default Select;
