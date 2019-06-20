import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID } from '../../helpers/component';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';
import { omit } from 'proton-shared/lib/helpers/object';

const Input = React.forwardRef((props, ref) => {
    const { className, error, ...rest } = omit(props, ['onPressEnter']);
    const { handlers, statusClasses, status } = useInput(props);
    const [uid] = useState(generateUID('input'));
    return (
        <>
            <input
                className={`pm-field w100 ${className} ${statusClasses}`}
                aria-invalid={error && status.isDirty}
                aria-describedby={uid}
                ref={ref}
                {...rest}
                {...handlers}
            />
            <ErrorZone id={uid}>{error && status.isDirty ? error : ''}</ErrorZone>
        </>
    );
});

Input.propTypes = {
    error: PropTypes.string,
    autoComplete: PropTypes.string,
    autoFocus: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    id: PropTypes.string,
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
