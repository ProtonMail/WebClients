import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Pikaday from 'pikaday';
import { classnames } from '../../helpers/component';

// Configuration: https://github.com/Pikaday/Pikaday#configuration
const DateInput = ({ id, disabled, required = false, placeholder, className = '', ...rest }) => {
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
            className={classnames(['pm-field w100', className])}
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

export default DateInput;
