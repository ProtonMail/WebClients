import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID } from '../../helpers/component';
import useInput from '../input/useInput';
import ErrorZone from '../text/ErrorZone';

const Select = ({ options, error, size = 1, className = '', multiple = false, ...rest }) => {
    const { handlers, statusClasses, status } = useInput({ ...rest });
    const [uid] = useState(generateUID('select'));

    return (
        <>
            <select
                className={`pm-field w100 ${className} ${statusClasses}`}
                size={size}
                multiple={multiple}
                {...rest}
                {...handlers}
            >
                {options.map(({ text, ...rest }, index) => (
                    <option key={index.toString()} {...rest}>
                        {text}
                    </option>
                ))}
            </select>
            <ErrorZone id={uid}>{error && status.isDirty ? error : ''}</ErrorZone>
        </>
    );
};

Select.propTypes = {
    error: PropTypes.string,
    disabled: PropTypes.bool,
    size: PropTypes.number,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    options: PropTypes.arrayOf(PropTypes.object),
    multiple: PropTypes.bool,
    className: PropTypes.string
};

export default Select;
