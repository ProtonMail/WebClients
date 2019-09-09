import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { generateUID } from '../../helpers/component';
import useInput from './useInput';
import ErrorZone from '../text/ErrorZone';
import { c } from 'ttag';

const Input = React.forwardRef(
    (
        {
            error,
            errorZoneClassName,
            autoComplete = 'off',
            className = '',
            type = 'text',
            onPressEnter,
            loading = false,
            required = false,
            ...rest
        },
        ref
    ) => {
        const { handlers, statusClasses, status } = useInput({ onPressEnter, ...rest });
        const [uid] = useState(generateUID('input'));
        const errorZone = required && !error ? c('Error').t`This field is required` : error;

        return (
            <>
                <input
                    className={`pm-field w100 ${className} ${statusClasses}`}
                    aria-invalid={errorZone && status.isDirty}
                    aria-describedby={uid}
                    ref={ref}
                    type={type}
                    autoComplete={autoComplete}
                    disabled={loading || rest.disabled}
                    {...rest}
                    {...handlers}
                />
                <ErrorZone className={errorZoneClassName} id={uid}>
                    {errorZone && status.isDirty ? errorZone : ''}
                </ErrorZone>
            </>
        );
    }
);

Input.propTypes = {
    error: PropTypes.string,
    errorZoneClassName: PropTypes.string,
    autoComplete: PropTypes.string,
    autoFocus: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    loading: PropTypes.bool,
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

export default Input;
