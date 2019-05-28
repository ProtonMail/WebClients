import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID } from '../../helpers/component';
import useInput from '../input/useInput';
import ErrorZone from '../text/ErrorZone';

const Select = (props) => {
    const { options, className, error, ...rest } = props;
    const { handlers, statusClasses, status } = useInput(props);
    const [uid] = useState(generateUID('select'));

    return (
        <>
            <select className={`pm-field ${className} ${statusClasses}`} {...rest} {...handlers}>
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
    className: 'w100',
    size: 1
};

export default Select;
