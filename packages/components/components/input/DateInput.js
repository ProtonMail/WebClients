import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Pikaday from 'pikaday';

// Configuration: https://github.com/Pikaday/Pikaday#configuration
const DateInput = ({ id, disabled, required, placeholder, className, ...rest }) => {
    const inputRef = useRef();

    useEffect(() => {
        const picker = new Pikaday({
            field: inputRef.current,
            ...rest
        });

        return () => picker.destroy();
    }, []);

    return (
        <input
            id={id}
            className={`pm-field ${className}`}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            ref={inputRef}
            type="text"
        />
    ); // Using type="text" as recommended by Pikaday (https://github.com/Pikaday/Pikaday)
};

DateInput.propTypes = {
    id: PropTypes.string,
    disabled: PropTypes.bool,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
    className: PropTypes.string
};

DateInput.defaultProps = {
    required: false,
    className: ''
};

export default DateInput;
