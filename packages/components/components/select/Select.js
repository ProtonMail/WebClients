import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID, classnames } from '../../helpers/component';
import useInput from '../input/useInput';
import ErrorZone from '../text/ErrorZone';

/** @type any */
const Select = ({
    options,
    error,
    size = 1,
    className = '',
    multiple = false,
    loading = false,
    isSubmitted = false,
    ...rest
}) => {
    const { handlers, statusClasses, status } = useInput({ isSubmitted, ...rest });
    const [uid] = useState(generateUID('select'));

    const hasError = error && (status.isDirty || isSubmitted);

    return (
        <>
            <select
                className={classnames(['pm-field w100', className, statusClasses])}
                size={size}
                multiple={multiple}
                disabled={loading || rest.disabled}
                {...rest}
                {...handlers}
            >
                {options.map(({ text, ...rest }, index) => (
                    <option key={index.toString()} {...rest}>
                        {text}
                    </option>
                ))}
            </select>
            <ErrorZone id={uid}>{hasError ? error : ''}</ErrorZone>
        </>
    );
};

Select.propTypes = {
    error: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
    isSubmitted: PropTypes.bool,
    size: PropTypes.number,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func,
    options: PropTypes.arrayOf(PropTypes.object),
    multiple: PropTypes.bool,
    className: PropTypes.string
};

export default Select;
